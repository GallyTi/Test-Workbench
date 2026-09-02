import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { EmailService } from './email.service';
import { TeamsService } from './teams.service';

@Injectable()
export class NotificationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
    private readonly teamsService: TeamsService,
  ) {}

  async notifyStepAssigned(userId: string, stepExecutionId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    const step = await this.prisma.testStepExecution.findUnique({
      where: { id: stepExecutionId },
      include: {
        testCaseStep: true,
        testCaseExecution: {
          include: { testCase: true, testRun: true },
        },
      },
    });

    if (!user || !step) return;

    const title = 'Bol ti pridelený testovací krok';
    const message = `Krok #${step.testCaseStep.stepNumber} v teste ${step.testCaseExecution.testCase.code} (${step.testCaseExecution.testCase.title})`;
    const actionUrl = `http://localhost:3000/test-runs/${step.testCaseExecution.testRunId}?stepId=${step.id}`;

    // 1. Uloženie in-app notifikácie
    await this.prisma.notification.create({
      data: {
        userId: user.id,
        type: 'STEP_ASSIGNED',
        title,
        message,
        actionUrl,
      },
    });

    // 2. Odoslanie emailu
    await this.emailService.sendStepAssignedNotification(
      user.email,
      user.fullName,
      step.testCaseExecution.testCase.title,
      step.testCaseStep.action,
      actionUrl,
    );

    // 3. Odoslanie do MS Teams
    await this.teamsService.sendTeamsMessage(
      `Pridelený testovací krok pre: ${user.fullName}`,
      message,
      [
        { name: 'Kód testu', value: step.testCaseExecution.testCase.code },
        { name: 'Krok', value: `#${step.testCaseStep.stepNumber}` },
        { name: 'Prostredie', value: step.testCaseExecution.testRun.environment },
      ],
      actionUrl,
    );
  }

  async getMyNotifications(userId: string) {
    return this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async createNotification(data: {
    userId: string;
    title: string;
    message: string;
    type?: string;
    entityType?: string;
    entityId?: string;
    actionUrl?: string;
  }) {
    const user = await this.prisma.user.findUnique({ where: { id: data.userId } });
    if (!user) return;

    const notif = await this.prisma.notification.create({
      data: {
        userId: data.userId,
        type: data.type || 'INFO',
        title: data.title,
        message: data.message,
        actionUrl: data.actionUrl,
      },
    });

    try {
      await this.emailService.sendStepAssignedNotification(
        user.email,
        user.fullName,
        data.title,
        data.message,
        data.actionUrl || `http://localhost:3002/test-cases`,
      );
    } catch {}

    return notif;
  }

  async markAsRead(id: string, userId: string) {
    return this.prisma.notification.updateMany({
      where: { id, userId },
      data: { isRead: true },
    });
  }
}
