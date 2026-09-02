import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional, MaxLength } from 'class-validator';

export class CreateProjectDto {
  @ApiProperty({ example: 'RITS', description: 'Unikátny kľúč projektu' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  key: string;

  @ApiProperty({ example: 'RITS / HIVE2 Integration Platform' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string;
}

export class CreateEpicDto {
  @ApiProperty({ example: 'EPIC-POS-01' })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiProperty({ example: 'POS to Central SAP CAR Integration' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string;
}

export class CreateSuiteDto {
  @ApiProperty({ required: false, description: 'ID nadradeného Epicu' })
  @IsOptional()
  @IsString()
  epicId?: string;

  @ApiProperty({ required: false, description: 'ID rodičovskej sady (pre vnorené zložky)' })
  @IsOptional()
  @IsString()
  parentSuiteId?: string;

  @ApiProperty({ example: 'WET - Wet Stock Suite' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string;
}
