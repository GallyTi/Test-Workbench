import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { CreateTestRunDto, UpdateStepExecutionDto } from './dto/test-run.dto';
import { StepStatusEnum, RunStatusEnum } from '@prisma/client';

@Injectable()
export class TestRunsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(projectId: string) {
    const runs = await this.prisma.testRun.findMany({
      where: { projectId },
      include: {
        createdBy: { select: { id: true, fullName: true } },
        executions: {
          select: {
            id: true,
            status: true,
            stepExecs: { select: { status: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return runs.map((run) => {
      const allSteps = run.executions.flatMap((e) => e.stepExecs);
      const totalSteps = allSteps.length;
      const passedSteps = allSteps.filter((s) => s.status === StepStatusEnum.PASSED).length;
      const failedSteps = allSteps.filter((s) => s.status === StepStatusEnum.FAILED).length;
      const blockedSteps = allSteps.filter((s) => s.status === StepStatusEnum.BLOCKED).length;

      return {
        id: run.id,
        title: run.title,
        environment: run.environment,
        status: run.status,
        createdAt: run.createdAt,
        createdBy: run.createdBy,
        stats: {
          totalTestCases: run.executions.length,
          totalSteps,
          passedSteps,
          failedSteps,
          blockedSteps,
          progressPercentage: totalSteps > 0 ? Math.round((passedSteps / totalSteps) * 100) : 0,
        },
      };
    });
  }

  async findOne(id: string) {
    const run = await this.prisma.testRun.findUnique({
      where: { id },
      include: {
        createdBy: { select: { id: true, fullName: true, email: true } },
        executions: {
          include: {
            testCase: {
              include: {
                suite: true,
                epic: true,
                graphLinks: true,
              },
            },
            assignedTo: { select: { id: true, fullName: true, email: true } },
            executedBy: { select: { id: true, fullName: true, email: true } },
            stepExecs: {
              include: {
                testCaseStep: true,
                assignedTo: { select: { id: true, fullName: true, email: true } },
                executedBy: { select: { id: true, fullName: true, email: true } },
                lastModifiedBy: { select: { id: true, fullName: true, email: true } },
                bugs: true,
              },
              orderBy: { testCaseStep: { stepNumber: 'asc' } },
            },
          },
        },
      },
    });

    if (!run) {
      throw new NotFoundException('Testovací beh nebol nájdený');
    }
    return run;
  }

  async create(projectId: string, dto: CreateTestRunDto, userId: string) {
    // 1. Load test cases with their steps
    const testCases = await this.prisma.testCase.findMany({
      where: {
        id: { in: dto.testCaseIds },
        projectId,
      },
      include: {
        steps: { orderBy: { stepNumber: 'asc' } },
      },
    });

    if (testCases.length === 0) {
      throw new NotFoundException('Neboli nájdené žiadne zadané testovacie prípady');
    }

    return this.prisma.$transaction(async (tx) => {
      const run = await tx.testRun.create({
        data: {
          projectId,
          title: dto.title,
          environment: dto.environment,
          status: RunStatusEnum.IN_PROGRESS,
          startedAt: new Date(),
          createdById: userId,
        },
      });

      for (const tc of testCases) {
        const caseExec = await tx.testCaseExecution.create({
          data: {
            testRunId: run.id,
            testCaseId: tc.id,
            status: StepStatusEnum.UNTESTED,
          },
        });

        if (tc.steps.length > 0) {
          await tx.testStepExecution.createMany({
            data: tc.steps.map((s) => ({
              testCaseExecutionId: caseExec.id,
              testCaseStepId: s.id,
              status: StepStatusEnum.UNTESTED,
            })),
          });
        }
      }

      return this.findOne(run.id);
    });
  }

  async updateStepExecution(stepExecutionId: string, dto: UpdateStepExecutionDto, userId: string) {
    const stepExec = await this.prisma.testStepExecution.findUnique({
      where: { id: stepExecutionId },
      include: {
        testCaseExecution: true,
        testCaseStep: true,
      },
    });

    if (!stepExec) {
      throw new NotFoundException('Krok exekúcie nebol nájdený');
    }

    if (
      dto.status === StepStatusEnum.PASSED &&
      (stepExec.requiresProofPhoto || stepExec.testCaseStep?.requiresProofPhoto)
    ) {
      const attachmentsCount = await this.prisma.attachment.count({
        where: {
          targetType: 'STEP_EXECUTION',
          targetId: stepExecutionId,
        },
      });

      if (attachmentsCount === 0) {
        throw new BadRequestException(
          'Tento krok má nastavenú povinnú fotografiu / screenshot ako dôkaz (Proof). Pred označením kroku za PASSED musíte nahrať aspoň jednu fotografiu.'
        );
      }
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      // 1. Update step execution
      const res = await tx.testStepExecution.update({
        where: { id: stepExecutionId },
        data: {
          status: dto.status,
          actualResult: dto.actualResult !== undefined ? dto.actualResult : stepExec.actualResult,
          assignedToId: dto.assignedToId !== undefined ? dto.assignedToId : stepExec.assignedToId,
          durationSecs: dto.durationSeconds ? stepExec.durationSecs + dto.durationSeconds : stepExec.durationSecs,
          executedById: dto.status !== StepStatusEnum.UNTESTED ? userId : stepExec.executedById,
          lastModifiedById: userId,
          completedAt: dto.status === StepStatusEnum.PASSED || dto.status === StepStatusEnum.FAILED ? new Date() : null,
        },
        include: {
          assignedTo: { select: { id: true, fullName: true } },
          executedBy: { select: { id: true, fullName: true } },
          testCaseStep: true,
        },
      });

      // 2. Rollup status to TestCaseExecution
      const allStepsForCase = await tx.testStepExecution.findMany({
        where: { testCaseExecutionId: stepExec.testCaseExecutionId },
      });

      let calculatedCaseStatus: StepStatusEnum = StepStatusEnum.PASSED;
      if (allStepsForCase.some((s) => s.status === StepStatusEnum.FAILED)) {
        calculatedCaseStatus = StepStatusEnum.FAILED;
      } else if (allStepsForCase.some((s) => s.status === StepStatusEnum.BLOCKED)) {
        calculatedCaseStatus = StepStatusEnum.BLOCKED;
      } else if (allStepsForCase.some((s) => s.status === StepStatusEnum.IN_PROGRESS)) {
        calculatedCaseStatus = StepStatusEnum.IN_PROGRESS;
      } else if (allStepsForCase.some((s) => s.status === StepStatusEnum.UNTESTED)) {
        calculatedCaseStatus = StepStatusEnum.IN_PROGRESS;
      }

      await tx.testCaseExecution.update({
        where: { id: stepExec.testCaseExecutionId },
        data: {
          status: calculatedCaseStatus,
          executedById: userId,
          completedAt: calculatedCaseStatus === StepStatusEnum.PASSED ? new Date() : null,
        },
      });

      // 3. Log into audit logs
      await tx.auditLog.create({
        data: {
          entityName: 'test_step_executions',
          entityId: stepExecutionId,
          userId,
          action: 'STATUS_CHANGE',
          previousState: { status: stepExec.status },
          newState: { status: dto.status, actualResult: dto.actualResult },
        },
      });

      return res;
    });

    return updated;
  }
}
