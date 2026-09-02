import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { StartStepTimerDto, StopStepTimerDto } from './dto/timer.dto';

@Injectable()
export class TimersService {
  constructor(private readonly prisma: PrismaService) {}

  async startTimer(dto: StartStepTimerDto, userId: string) {
    const step = await this.prisma.testStepExecution.findUnique({
      where: { id: dto.stepExecutionId },
    });

    if (!step) {
      throw new NotFoundException('Krok nebol nájdený');
    }

    return this.prisma.executionTimeLog.create({
      data: {
        stepExecutionId: dto.stepExecutionId,
        userId,
        startedAt: new Date(),
      },
    });
  }

  async stopTimer(dto: StopStepTimerDto) {
    const log = await this.prisma.executionTimeLog.findUnique({
      where: { id: dto.timeLogId },
    });

    if (!log) {
      throw new NotFoundException('Časový záznam nebol nájdený');
    }

    const endedAt = new Date();
    const durationSecs = Math.round((endedAt.getTime() - log.startedAt.getTime()) / 1000);

    const updatedLog = await this.prisma.executionTimeLog.update({
      where: { id: dto.timeLogId },
      data: {
        endedAt,
        durationSecs,
        isIdle: dto.isIdle || false,
      },
    });

    // Update total duration in step execution
    await this.prisma.testStepExecution.update({
      where: { id: log.stepExecutionId },
      data: {
        durationSecs: { increment: durationSecs },
      },
    });

    return updatedLog;
  }

  async getAdminBottleneckReport(projectId: string) {
    // 1. Získanie všetkých aktívnych krokov v stave IN_PROGRESS alebo BLOCKED
    const pendingSteps = await this.prisma.testStepExecution.findMany({
      where: {
        status: { in: ['IN_PROGRESS', 'BLOCKED'] },
        testCaseExecution: {
          testRun: { projectId },
        },
      },
      include: {
        assignedTo: { select: { id: true, fullName: true, email: true } },
        testCaseStep: true,
        testCaseExecution: {
          include: {
            testCase: { select: { code: true, title: true } },
            testRun: { select: { title: true, environment: true } },
          },
        },
        timeLogs: {
          orderBy: { startedAt: 'desc' },
          take: 1,
        },
      },
    });

    // 2. Štatistiky testerov (kto koľko času strávil a na koho sa čaká)
    const testerStatsMap = new Map<string, {
      userId: string;
      fullName: string;
      email: string;
      activePendingCount: number;
      blockedCount: number;
      totalLoggedSeconds: number;
    }>();

    for (const step of pendingSteps) {
      if (!step.assignedTo) continue;
      const uid = step.assignedTo.id;
      if (!testerStatsMap.has(uid)) {
        testerStatsMap.set(uid, {
          userId: uid,
          fullName: step.assignedTo.fullName,
          email: step.assignedTo.email,
          activePendingCount: 0,
          blockedCount: 0,
          totalLoggedSeconds: 0,
        });
      }
      const stat = testerStatsMap.get(uid)!;
      if (step.status === 'BLOCKED') stat.blockedCount++;
      else stat.activePendingCount++;
    }

    // 3. Celkový strávený čas používateľov
    const userTimeAggregates = await this.prisma.executionTimeLog.groupBy({
      by: ['userId'],
      _sum: { durationSecs: true },
      where: {
        stepExecution: {
          testCaseExecution: { testRun: { projectId } },
        },
      },
    });

    for (const agg of userTimeAggregates) {
      if (testerStatsMap.has(agg.userId)) {
        testerStatsMap.get(agg.userId)!.totalLoggedSeconds = agg._sum.durationSecs || 0;
      }
    }

    return {
      pendingStepsCount: pendingSteps.length,
      blockedStepsCount: pendingSteps.filter((s) => s.status === 'BLOCKED').length,
      testerBottlenecks: Array.from(testerStatsMap.values()),
      criticalPendingSteps: pendingSteps.map((s) => ({
        stepExecutionId: s.id,
        testCaseCode: s.testCaseExecution.testCase.code,
        testCaseTitle: s.testCaseExecution.testCase.title,
        stepNumber: s.testCaseStep.stepNumber,
        action: s.testCaseStep.action,
        status: s.status,
        assignedTo: s.assignedTo ? s.assignedTo.fullName : 'Nepriradené',
        totalDurationSeconds: s.durationSecs,
        updatedAt: s.updatedAt,
      })),
    };
  }
}
