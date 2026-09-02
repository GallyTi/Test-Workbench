import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { S3StorageService } from '../attachments/s3-storage.service';
import * as XLSX from 'xlsx';
import { randomUUID } from 'crypto';
import { PreviewMappingDto, ExecuteImportDto } from './dto/excel-import.dto';

@Injectable()
export class ExcelImportService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly s3Service: S3StorageService,
  ) {}

  async uploadFile(projectId: string, file: Express.Multer.File, userId: string) {
    let workbook: XLSX.WorkBook;
    try {
      workbook = XLSX.read(file.buffer, { type: 'buffer' });
    } catch {
      throw new BadRequestException('Súbor sa nepodarilo prečítať ako platný Excel (.xlsx/.xls/.csv)');
    }

    const sheetNames = workbook.SheetNames;
    if (sheetNames.length === 0) {
      throw new BadRequestException('Excel súbor neobsahuje žiadne hárky');
    }

    const firstSheetName = sheetNames[0];
    const firstSheet = workbook.Sheets[firstSheetName];
    const rawData = XLSX.utils.sheet_to_json(firstSheet, { header: 'A', defval: '' }) as Record<string, any>[];

    const storageKey = `imports/${projectId}/${randomUUID()}_${file.originalname}`;
    await this.s3Service.uploadFile(storageKey, file.buffer, file.mimetype);

    // Heuristický odhad mapovania stĺpcov podľa prvého riadka
    const headers = rawData[0] || {};
    const autoMapping: Record<string, string> = {};

    for (const [colKey, cellValue] of Object.entries(headers)) {
      const valStr = String(cellValue).toLowerCase();
      if (valStr.includes('kód') || valStr.includes('code') || valStr.includes('id')) autoMapping['code'] = colKey;
      else if (valStr.includes('názov') || valStr.includes('title') || valStr.includes('name')) autoMapping['title'] = colKey;
      else if (valStr.includes('predpoklad') || valStr.includes('precondition')) autoMapping['preconditions'] = colKey;
      else if (valStr.includes('krok') || valStr.includes('step')) autoMapping['stepNumber'] = colKey;
      else if (valStr.includes('akcia') || valStr.includes('action') || valStr.includes('popis')) autoMapping['action'] = colKey;
      else if (valStr.includes('očakáv') || valStr.includes('expected') || valStr.includes('výsledok')) autoMapping['expectedResult'] = colKey;
      else if (valStr.includes('dáta') || valStr.includes('data') || valStr.includes('payload')) autoMapping['testData'] = colKey;
    }

    const job = await this.prisma.excelImportJob.create({
      data: {
        projectId,
        fileName: file.originalname,
        storageKey,
        status: 'PARSED',
        sheetName: firstSheetName,
        columnMapping: autoMapping,
        previewData: rawData.slice(0, 10),
        stats: { totalRows: rawData.length, sheetNames },
        uploadedById: userId,
      },
    });

    return {
      jobId: job.id,
      fileName: job.fileName,
      sheetNames,
      activeSheet: firstSheetName,
      totalRows: rawData.length,
      columnMappingGuess: autoMapping,
      previewRows: rawData.slice(0, 10),
    };
  }

  async previewMapping(dto: PreviewMappingDto) {
    const job = await this.prisma.excelImportJob.findUnique({
      where: { id: dto.jobId },
    });

    if (!job) {
      throw new NotFoundException('Import úloha nebola nájdená');
    }

    // Uložíme aktualizované mapovanie
    await this.prisma.excelImportJob.update({
      where: { id: dto.jobId },
      data: {
        columnMapping: dto.columnMapping,
        sheetName: dto.sheetName || job.sheetName,
        status: 'MAPPED',
      },
    });

    const rawRows = (job.previewData as Record<string, any>[]) || [];
    // Transformujeme riadky podľa mapovania
    const mappedPreview = rawRows.slice(1).map((row, idx) => ({
      rowIndex: idx + 2,
      code: row[dto.columnMapping.code] || `TC_IMPORT_${idx + 1}`,
      title: row[dto.columnMapping.title] || 'Bez názvu',
      preconditions: row[dto.columnMapping.preconditions] || '',
      stepNumber: Number(row[dto.columnMapping.stepNumber]) || 1,
      action: row[dto.columnMapping.action] || 'Bez popisu akcie',
      expectedResult: row[dto.columnMapping.expectedResult] || 'Očakávaný stav',
      testData: row[dto.columnMapping.testData] || '',
    }));

    return {
      jobId: job.id,
      mappedPreview,
    };
  }

  async executeImport(dto: ExecuteImportDto, userId: string) {
    const job = await this.prisma.excelImportJob.findUnique({
      where: { id: dto.jobId },
    });

    if (!job) {
      throw new NotFoundException('Import úloha nebola nájdená');
    }

    const mapping = job.columnMapping as Record<string, string>;
    if (!mapping.code || !mapping.action || !mapping.expectedResult) {
      throw new BadRequestException('Mapovanie musí obsahovať minimálne stĺpce pre Code, Action a ExpectedResult');
    }

    // Načítame z previewData (alebo plného zoznamu)
    const rawRows = (job.previewData as Record<string, any>[]) || [];
    const rowsToProcess = rawRows.slice(1);

    // Zoskupenie riadkov podľa TestCase Code
    const groupedCases = new Map<string, {
      code: string;
      title: string;
      preconditions: string;
      steps: Array<{ stepNumber: number; action: string; expectedResult: string; testData: string }>;
    }>();

    for (let i = 0; i < rowsToProcess.length; i++) {
      const r = rowsToProcess[i];
      const code = String(r[mapping.code] || `TC_IMP_${i + 1}`).trim().toUpperCase();
      const title = String(r[mapping.title] || `Test Case ${code}`).trim();
      const preconditions = String(r[mapping.preconditions] || '').trim();
      const stepNumber = Number(r[mapping.stepNumber]) || (groupedCases.get(code)?.steps.length || 0) + 1;
      const action = String(r[mapping.action] || 'Krok bez akcie').trim();
      const expectedResult = String(r[mapping.expectedResult] || 'Očakávaný úspech').trim();
      const testData = String(r[mapping.testData] || '').trim();

      if (!groupedCases.has(code)) {
        groupedCases.set(code, {
          code,
          title,
          preconditions,
          steps: [],
        });
      }

      groupedCases.get(code)!.steps.push({
        stepNumber,
        action,
        expectedResult,
        testData,
      });
    }

    let createdCount = 0;
    await this.prisma.$transaction(async (tx) => {
      for (const [code, caseData] of groupedCases.entries()) {
        const existing = await tx.testCase.findUnique({
          where: { projectId_code: { projectId: job.projectId, code } },
        });

        if (!existing) {
          await tx.testCase.create({
            data: {
              projectId: job.projectId,
              suiteId: dto.suiteId,
              epicId: dto.epicId,
              code: caseData.code,
              title: caseData.title,
              preconditions: caseData.preconditions,
              createdById: userId,
              steps: {
                create: caseData.steps.map((s) => ({
                  stepNumber: s.stepNumber,
                  action: s.action,
                  expectedResult: s.expectedResult,
                  testData: s.testData,
                })),
              },
            },
          });
          createdCount++;
        }
      }

      await tx.excelImportJob.update({
        where: { id: job.id },
        data: {
          status: 'COMPLETED',
          stats: { totalImportedCases: createdCount },
        },
      });
    });

    return {
      success: true,
      jobId: job.id,
      importedCasesCount: createdCount,
    };
  }
}
