import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { CreateBugDto } from './dto/bug.dto';

@Injectable()
export class BugsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateBugDto, reportedById: string) {
    return this.prisma.$transaction(async (tx) => {
      const bug = await tx.bugReport.create({
        data: {
          projectId: dto.projectId,
          stepExecutionId: dto.stepExecutionId,
          code: dto.code.toUpperCase(),
          title: dto.title,
          description: dto.description,
          severity: dto.severity,
          assignedToId: dto.assignedToId,
          reportedById,
          externalTicketUrl: dto.externalTicketUrl,
        },
        include: {
          reportedBy: { select: { id: true, fullName: true, email: true } },
          assignedTo: { select: { id: true, fullName: true, email: true } },
        },
      });

      // Ak je bug naviazaný na krok, automaticky môžeme označiť krok ako FAILED alebo BLOCKED
      if (dto.stepExecutionId) {
        await tx.testStepExecution.update({
          where: { id: dto.stepExecutionId },
          data: {
            status: 'FAILED',
            lastModifiedById: reportedById,
            updatedAt: new Date(),
          },
        });
      }

      return bug;
    });
  }

  async findByProject(projectId: string) {
    return this.prisma.bugReport.findMany({
      where: { projectId },
      include: {
        reportedBy: { select: { id: true, fullName: true } },
        assignedTo: { select: { id: true, fullName: true } },
        stepExecution: {
          include: {
            testCaseStep: true,
            testCaseExecution: {
              include: { testCase: true, testRun: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
