import { Controller, Get, Query, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AuditLogService } from './audit-log.service';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('Audit & História Zmien (Audit Trail & Change Logs)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('audit-logs')
export class AuditLogController {
  constructor(private readonly auditLogService: AuditLogService) {}

  @Get()
  @Roles(UserRole.ADMIN, UserRole.TEST_LEAD)
  @ApiOperation({ summary: 'Zoznam všetkých auditných záznamov (kto, čo, kedy zmenil)' })
  @ApiQuery({ name: 'entityName', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async findAll(
    @Query('entityName') entityName?: string,
    @Query('limit') limit?: string,
  ) {
    return this.auditLogService.findAll(limit ? parseInt(limit, 10) : 100, entityName);
  }

  @Get(':entityName/:entityId')
  @ApiOperation({ summary: 'História zmien a audit trail pre konkrétnu entitu (napr. testovací krok)' })
  async findForEntity(
    @Param('entityName') entityName: string,
    @Param('entityId') entityId: string,
  ) {
    return this.auditLogService.findForEntity(entityName, entityId);
  }
}
