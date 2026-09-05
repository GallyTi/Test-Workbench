import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional, IsEnum } from 'class-validator';
import { BugSeverityEnum } from '@prisma/client';

export class CreateBugDto {
  @ApiProperty({ example: 'uuid-project-id' })
  @IsString()
  @IsNotEmpty()
  projectId: string;

  @ApiProperty({ example: 'uuid-step-execution-id', required: false })
  @IsOptional()
  @IsString()
  stepExecutionId?: string;

  @ApiProperty({ example: 'BUG-2026-001' })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiProperty({ example: 'Payload ORDERS05 zlyhal na chýbajúcom segmente E1EDK01' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ example: 'Pri prenose dát došlo k validačnej chybe IDocu. Návratový kód 500.' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ enum: BugSeverityEnum, default: BugSeverityEnum.MAJOR, required: false })
  @IsOptional()
  @IsEnum(BugSeverityEnum)
  severity?: BugSeverityEnum;

  @ApiProperty({ example: 'uuid-assigned-user-id', required: false })
  @IsOptional()
  @IsString()
  assignedToId?: string;

  @ApiProperty({ example: 'https://jira.company.com/browse/PROJ-1234', required: false })
  @IsOptional()
  @IsString()
  externalTicketUrl?: string;
}

export class UpdateBugDto {
  @ApiProperty({ example: 'Názov chyby', required: false })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiProperty({ example: 'Popis chyby', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ enum: BugSeverityEnum, required: false })
  @IsOptional()
  @IsEnum(BugSeverityEnum)
  severity?: BugSeverityEnum;

  @ApiProperty({ example: 'IN_PROGRESS', required: false })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiProperty({ example: 'uuid-assigned-user-id', required: false })
  @IsOptional()
  @IsString()
  assignedToId?: string;

  @ApiProperty({ example: 'HIVE2-1049', required: false })
  @IsOptional()
  @IsString()
  externalTicketUrl?: string;
}
