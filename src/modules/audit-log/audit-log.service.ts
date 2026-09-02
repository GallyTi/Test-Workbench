import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';

@Injectable()
export class AuditLogService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(limit = 100, entityName?: string) {
    return this.prisma.auditLog.findMany({
      where: entityName ? { entityName } : undefined,
      include: {
        user: { select: { id: true, fullName: true, email: true, role: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  async findForEntity(entityName: string, entityId: string) {
    return this.prisma.auditLog.findMany({
      where: { entityName, entityId },
      include: {
        user: { select: { id: true, fullName: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
