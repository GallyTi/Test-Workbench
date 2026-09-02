import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional, IsEnum, IsArray, ValidateNested, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { PriorityLevel, TestTypeEnum, TestStatusEnum } from '@prisma/client';

export class CreateStepDto {
  @ApiProperty({ example: 1 })
  @IsInt()
  @Min(1)
  stepNumber: number;

  @ApiProperty({ example: 'Odoslať POST požiadavku na /api/orders s payloadom ORDERS05' })
  @IsString()
  @IsNotEmpty()
  action: string;

  @ApiProperty({ example: 'HTTP 200 OK a správa sa objaví v SAP PO message monitore' })
  @IsString()
  @IsNotEmpty()
  expectedResult: string;

  @ApiProperty({ example: '{"order_id": "100234", "store_code": "SK01"}', required: false })
  @IsOptional()
  @IsString()
  testData?: string;
}

export class CreateTestCaseDto {
  @ApiProperty({ example: 'TC_WET_001' })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiProperty({ example: 'Overenie prenosu dodacieho listu z DOMS do SAP CAR' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: '1. Systém DOMS online.\n2. Integračný kanál spustený.', required: false })
  @IsOptional()
  @IsString()
  preconditions?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  suiteId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  epicId?: string;

  @ApiProperty({ enum: PriorityLevel, default: PriorityLevel.MEDIUM, required: false })
  @IsOptional()
  @IsEnum(PriorityLevel)
  priority?: PriorityLevel;

  @ApiProperty({ enum: TestTypeEnum, default: TestTypeEnum.MANUAL, required: false })
  @IsOptional()
  @IsEnum(TestTypeEnum)
  testType?: TestTypeEnum;

  @ApiProperty({ enum: TestStatusEnum, default: TestStatusEnum.READY, required: false })
  @IsOptional()
  @IsEnum(TestStatusEnum)
  status?: TestStatusEnum;

  @ApiProperty({ example: 15, default: 15, required: false })
  @IsOptional()
  @IsInt()
  estimatedDurationMinutes?: number;

  @ApiProperty({ example: ['WET', 'SAP_PO', 'SMOKE_2026'], required: false })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiProperty({ type: [CreateStepDto], required: false })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateStepDto)
  steps?: CreateStepDto[];

  @ApiProperty({ example: ['IF_RITS_009', 'SYS_DOMS'], required: false, description: 'Prepojenia na grafové objekty' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  graphObjectIds?: string[];
}
