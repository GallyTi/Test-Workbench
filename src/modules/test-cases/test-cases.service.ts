import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { CreateTestCaseDto } from './dto/test-case.dto';
import { StepStatusEnum, TestStatusEnum } from '@prisma/client';
import { NotificationsService } from '../notifications/notifications.service';
import { RealtimeGateway } from '../realtime/realtime.gateway';
import { S3StorageService } from '../attachments/s3-storage.service';

@Injectable()
export class TestCasesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
    private readonly realtimeGateway: RealtimeGateway,
    private readonly s3StorageService: S3StorageService,
  ) {}

  async findAll(projectId: string, filters?: { suiteId?: string; epicId?: string; tag?: string }) {
    return this.prisma.testCase.findMany({
      where: {
        projectId,
        ...(filters?.suiteId && { suiteId: filters.suiteId }),
        ...(filters?.epicId && { epicId: filters.epicId }),
        ...(filters?.tag && { tags: { has: filters.tag } }),
      },
      include: {
        steps: {
          orderBy: { stepNumber: 'asc' },
          include: {
            assignedTo: { select: { id: true, fullName: true, email: true } },
            executedBy: { select: { id: true, fullName: true, email: true } },
          },
        },
        outgoingLinks: {
          include: {
            targetCase: { select: { id: true, code: true, title: true, priority: true, status: true } },
          },
        },
        incomingLinks: {
          include: {
            sourceCase: { select: { id: true, code: true, title: true, priority: true, status: true } },
          },
        },
        graphLinks: true,
        createdBy: {
          select: { id: true, fullName: true, email: true },
        },
      },
      orderBy: { code: 'asc' },
    });
  }

  async findOne(id: string) {
    const testCase = await this.prisma.testCase.findUnique({
      where: { id },
      include: {
        steps: {
          orderBy: { stepNumber: 'asc' },
          include: {
            assignedTo: { select: { id: true, fullName: true, email: true } },
            executedBy: { select: { id: true, fullName: true, email: true } },
          },
        },
        outgoingLinks: {
          include: {
            targetCase: { select: { id: true, code: true, title: true, priority: true, status: true } },
          },
        },
        incomingLinks: {
          include: {
            sourceCase: { select: { id: true, code: true, title: true, priority: true, status: true } },
          },
        },
        graphLinks: true,
        suite: true,
        epic: true,
        createdBy: {
          select: { id: true, fullName: true, email: true },
        },
      },
    });

    if (!testCase) {
      throw new NotFoundException('Test case nebol nájdený');
    }
    return testCase;
  }

  async create(projectId: string, dto: CreateTestCaseDto, userId: string) {
    const existing = await this.prisma.testCase.findUnique({
      where: {
        projectId_code: {
          projectId,
          code: dto.code.toUpperCase(),
        },
      },
    });

    if (existing) {
      throw new ConflictException(`Test case s kódom ${dto.code} už v projekte existuje`);
    }

    return this.prisma.$transaction(async (tx) => {
      const createdCase = await tx.testCase.create({
        data: {
          projectId,
          suiteId: dto.suiteId,
          epicId: dto.epicId,
          code: dto.code.toUpperCase(),
          title: dto.title,
          description: dto.description,
          preconditions: dto.preconditions,
          priority: dto.priority,
          testType: dto.testType,
          status: dto.status,
          estimatedDurationMins: dto.estimatedDurationMinutes,
          tags: dto.tags || [],
          createdById: userId,
          steps: {
            create:
              dto.steps?.map((s) => ({
                stepNumber: s.stepNumber,
                action: s.action,
                expectedResult: s.expectedResult,
                testData: s.testData,
              })) || [],
          },
        },
      });

      if (dto.graphObjectIds && dto.graphObjectIds.length > 0) {
        await tx.testCaseGraphLink.createMany({
          data: dto.graphObjectIds.map((objId) => ({
            testCaseId: createdCase.id,
            graphObjectId: objId,
            relationshipType: 'validates',
          })),
          skipDuplicates: true,
        });
      }

      return this.findOne(createdCase.id);
    });
  }

  async updateStep(
    stepId: string,
    data: {
      status?: StepStatusEnum;
      actualResult?: string;
      assignedToId?: string;
      requiresProofPhoto?: boolean;
      action?: string;
      expectedResult?: string;
      testData?: string;
      stepNumber?: number;
    },
    userId: string,
  ) {
    const step = await this.prisma.testCaseStep.findUnique({
      where: { id: stepId },
      include: {
        testCase: true,
      },
    });

    if (!step) {
      throw new NotFoundException('Testovací krok nebol nájdený');
    }

    // Ak krok vyžaduje povinnú fotografiu a označuje sa ako PASSED, overiť prítomnosť prílohy
    const isRequired = data.requiresProofPhoto !== undefined ? data.requiresProofPhoto : step.requiresProofPhoto;
    if (isRequired && data.status === StepStatusEnum.PASSED) {
      const attachmentsCount = await this.prisma.attachment.count({
        where: {
          targetType: { in: ['STEP_DIRECT', 'STEP_EXECUTION', 'TEST_CASE_STEP'] },
          targetId: stepId,
        },
      });

      if (attachmentsCount === 0) {
        throw new BadRequestException(
          'Tento krok má nastavené povinné priloženie fotografie / screenshotu ako dôkaz (Proof). Bez priloženej fotografie nie je možné krok uzavrieť ako Úspešný (PASSED).'
        );
      }
    }

    const prevAssignedId = step.assignedToId;

    const updatedStep = await this.prisma.testCaseStep.update({
      where: { id: stepId },
      data: {
        ...(data.status && { status: data.status, executedById: userId }),
        ...(data.actualResult !== undefined && { actualResult: data.actualResult }),
        ...(data.assignedToId !== undefined && { assignedToId: data.assignedToId || null }),
        ...(data.requiresProofPhoto !== undefined && { requiresProofPhoto: data.requiresProofPhoto }),
        ...(data.action !== undefined && { action: data.action }),
        ...(data.expectedResult !== undefined && { expectedResult: data.expectedResult }),
        ...(data.testData !== undefined && { testData: data.testData }),
        ...(data.stepNumber !== undefined && { stepNumber: data.stepNumber }),
      },
      include: {
        assignedTo: { select: { id: true, fullName: true, email: true } },
        executedBy: { select: { id: true, fullName: true, email: true } },
      },
    });

    // Notify assigned user if newly assigned
    if (data.assignedToId && data.assignedToId !== prevAssignedId && data.assignedToId !== userId) {
      await this.notificationsService.createNotification({
        userId: data.assignedToId,
        title: `Testovací krok čaká na teba!`,
        message: `Krok #${step.stepNumber} v scenári ${step.testCase.code} (${step.action.slice(0, 40)}...) ti bol pridelený na otestovanie.`,
        type: 'STEP_ASSIGNED',
        entityType: 'TEST_CASE_STEP',
        entityId: step.id,
      });
    }

    // Rollup execution status to TestCase metadata
    const allSteps = await this.prisma.testCaseStep.findMany({
      where: { testCaseId: step.testCaseId },
    });

    let executionRollup = 'UNTESTED';
    if (allSteps.every((s) => s.status === StepStatusEnum.PASSED)) {
      executionRollup = 'PASSED';
    } else if (allSteps.some((s) => s.status === StepStatusEnum.FAILED)) {
      executionRollup = 'FAILED';
    } else if (allSteps.some((s) => s.status === StepStatusEnum.BLOCKED)) {
      executionRollup = 'BLOCKED';
    } else if (allSteps.some((s) => s.status === StepStatusEnum.IN_PROGRESS || s.status === StepStatusEnum.PASSED)) {
      executionRollup = 'IN_PROGRESS';
    }

    await this.prisma.testCase.update({
      where: { id: step.testCaseId },
      data: {
        metadata: {
          executionStatus: executionRollup,
        },
      },
    });

    // Broadcast update via WebSocket
    this.realtimeGateway.server.emit('step_updated', {
      stepId: step.id,
      testCaseId: step.testCaseId,
    });

    return updatedStep;
  }

  async createRelationship(sourceCaseId: string, targetCaseId: string, linkType: string) {
    if (sourceCaseId === targetCaseId) {
      throw new BadRequestException('Nemôžete prepojiť testovací scenár so sebou samým');
    }

    return this.prisma.testCaseRelationship.upsert({
      where: {
        sourceCaseId_targetCaseId_linkType: {
          sourceCaseId,
          targetCaseId,
          linkType: linkType || 'RELATED',
        },
      },
      update: {},
      create: {
        sourceCaseId,
        targetCaseId,
        linkType: linkType || 'RELATED',
      },
    });
  }

  async deleteRelationship(id: string) {
    return this.prisma.testCaseRelationship.delete({ where: { id } });
  }

  async resetTestCase(id: string) {
    await this.findOne(id);

    // 1. Nájdeme všetky kroky tohto testovacieho scenára
    const steps = await this.prisma.testCaseStep.findMany({
      where: { testCaseId: id },
      select: { id: true },
    });
    const stepIds = steps.map((s) => s.id);

    // 2. Nájdeme všetky exekúcie týchto krokov (ak existujú v testovacích behoch)
    const stepExecs = await this.prisma.testStepExecution.findMany({
      where: { testCaseStepId: { in: stepIds } },
      select: { id: true },
    });
    const stepExecIds = stepExecs.map((se) => se.id);

    // Zoznam všetkých ID naviazaných na tento test case alebo jeho kroky
    const allTargetIds = [id, ...stepIds, ...stepExecIds];

    // 3. Zmažeme všetky komentáre, zmienky a reakcie (onDelete: Cascade vymaže mentions & reactions)
    await this.prisma.comment.deleteMany({
      where: {
        targetId: { in: allTargetIds },
      },
    });

    // 4. Zmažeme všetky prílohy a dôkazové fotografie (fyzicky zo S3 / disku aj z databázy)
    const attachments = await this.prisma.attachment.findMany({
      where: {
        targetId: { in: allTargetIds },
      },
    });

    for (const att of attachments) {
      if (att.storageKey) {
        await this.s3StorageService.deleteFile(att.storageKey).catch(() => {});
      }
    }

    await this.prisma.attachment.deleteMany({
      where: {
        targetId: { in: allTargetIds },
      },
    });

    // 5. Zresetujeme stav krokov scenára na UNTESTED a vymažeme skutočné výsledky
    await this.prisma.testCaseStep.updateMany({
      where: { testCaseId: id },
      data: {
        status: StepStatusEnum.UNTESTED,
        actualResult: null,
        executedById: null,
        durationSecs: 0,
      },
    });

    // 6. Ak existujú exekúcie v testovacích behoch, vyčistíme aj tie
    if (stepExecIds.length > 0) {
      await this.prisma.testStepExecution.updateMany({
        where: { id: { in: stepExecIds } },
        data: {
          status: StepStatusEnum.UNTESTED,
          actualResult: null,
          executedById: null,
          durationSecs: 0,
        },
      });
    }

    // 7. Zresetujeme metadata testovacieho scenára
    await this.prisma.testCase.update({
      where: { id },
      data: {
        metadata: {
          executionStatus: 'UNTESTED',
        },
      },
    });

    // 8. Odošleme WebSocket eventy pre okamžitú aktualizáciu klientov
    this.realtimeGateway.server.emit('step_updated', {
      testCaseId: id,
    });
    this.realtimeGateway.server.emit('test_case_reset', {
      testCaseId: id,
    });

    return this.findOne(id);
  }

  async addStep(
    testCaseId: string,
    data: {
      action: string;
      expectedResult: string;
      testData?: string;
      stepNumber?: number;
      assignedToId?: string;
      requiresProofPhoto?: boolean;
    },
    userId: string,
  ) {
    const testCase = await this.prisma.testCase.findUnique({
      where: { id: testCaseId },
      include: { steps: { select: { stepNumber: true } } },
    });

    if (!testCase) {
      throw new NotFoundException('Testovací scenár nebol nájdený');
    }

    let nextStepNum = data.stepNumber;
    if (!nextStepNum) {
      const maxNum = testCase.steps.reduce((max, s) => Math.max(max, s.stepNumber), 0);
      nextStepNum = maxNum + 1;
    }

    const createdStep = await this.prisma.testCaseStep.create({
      data: {
        testCaseId,
        stepNumber: nextStepNum,
        action: data.action,
        expectedResult: data.expectedResult,
        testData: data.testData || null,
        assignedToId: data.assignedToId || null,
        requiresProofPhoto: !!data.requiresProofPhoto,
        status: StepStatusEnum.UNTESTED,
      },
      include: {
        assignedTo: { select: { id: true, fullName: true, email: true } },
        executedBy: { select: { id: true, fullName: true, email: true } },
      },
    });

    this.realtimeGateway.server.emit('step_updated', {
      stepId: createdStep.id,
      testCaseId,
    });

    return createdStep;
  }

  async deleteStep(stepId: string, userId: string) {
    const step = await this.prisma.testCaseStep.findUnique({
      where: { id: stepId },
    });
    if (!step) {
      throw new NotFoundException('Testovací krok nebol nájdený');
    }

    await this.prisma.testCaseStep.delete({
      where: { id: stepId },
    });

    this.realtimeGateway.server.emit('step_updated', {
      stepId,
      testCaseId: step.testCaseId,
    });

    return { success: true };
  }

  async delete(id: string) {
    await this.findOne(id);
    return this.prisma.testCase.delete({ where: { id } });
  }
}
