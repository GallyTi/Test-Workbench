import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional, IsArray, IsEnum, IsInt } from 'class-validator';
import { StepStatusEnum, RunStatusEnum } from '@prisma/client';

export class CreateTestRunDto {
  @ApiProperty({ example: 'Release 2.4 - Smoke Test Matrix' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ example: 'STAGING', description: 'DEV, STAGING, PROD, QA' })
  @IsString()
  @IsNotEmpty()
  environment: string;

  @ApiProperty({ example: ['uuid-case-1', 'uuid-case-2'], description: 'Zoznam ID test casov zaradených do runu' })
  @IsArray()
  @IsString({ each: true })
  testCaseIds: string[];
}

export class UpdateStepExecutionDto {
  @ApiProperty({ enum: StepStatusEnum, example: StepStatusEnum.PASSED })
  @IsEnum(StepStatusEnum)
  status: StepStatusEnum;

  @ApiProperty({ example: 'Správa dorazila do SAP CAR do 3 sekúnd, payload overený.', required: false })
  @IsOptional()
  @IsString()
  actualResult?: string;

  @ApiProperty({ example: 'uuid-user-id', required: false, description: 'Priradenie človeka k testovaciemu kroku' })
  @IsOptional()
  @IsString()
  assignedToId?: string;

  @ApiProperty({ example: 45, required: false, description: 'Trvanie v sekundách' })
  @IsOptional()
  @IsInt()
  durationSeconds?: number;
}
