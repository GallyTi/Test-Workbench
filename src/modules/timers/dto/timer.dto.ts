import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional, IsBoolean } from 'class-validator';

export class StartStepTimerDto {
  @ApiProperty({ example: 'uuid-step-execution-id' })
  @IsString()
  @IsNotEmpty()
  stepExecutionId: string;
}

export class StopStepTimerDto {
  @ApiProperty({ example: 'uuid-time-log-id' })
  @IsString()
  @IsNotEmpty()
  timeLogId: string;

  @ApiProperty({ example: false, required: false })
  @IsOptional()
  @IsBoolean()
  isIdle?: boolean;
}
