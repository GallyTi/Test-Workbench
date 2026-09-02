import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsArray, IsOptional } from 'class-validator';

export class CreateCommentDto {
  @ApiProperty({ example: 'STEP_EXECUTION', description: 'STEP_EXECUTION, TEST_CASE, BUG' })
  @IsString()
  @IsNotEmpty()
  targetType: string;

  @ApiProperty({ example: 'uuid-target-id' })
  @IsString()
  @IsNotEmpty()
  targetId: string;

  @ApiProperty({ example: 'Krok je zablokovaný na timeout rozhrania, @peter.kovac prosím over konfiguráciu kanála.' })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiProperty({ example: ['uuid-mentioned-user-1'], required: false })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  mentionedUserIds?: string[];
}
