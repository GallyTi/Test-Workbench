import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional, IsArray, IsInt } from 'class-validator';

export class CreateDocSpaceDto {
  @ApiProperty({ example: 'RITS-DOC', description: 'Unikátny kľúč priestoru dokumentácie' })
  @IsString()
  @IsNotEmpty()
  key: string;

  @ApiProperty({ example: 'RITS Enterprise Architektúra & Integračné Manuály' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ required: false, example: '📚' })
  @IsOptional()
  @IsString()
  icon?: string;

  @ApiProperty({ required: false, example: '#3b82f6' })
  @IsOptional()
  @IsString()
  color?: string;

  @ApiProperty({ required: false, description: 'ID projektu, ak je priestor priradený k projektu' })
  @IsOptional()
  @IsString()
  projectId?: string;
}

export class UpdateDocSpaceDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  icon?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  color?: string;
}

export class CreateDocPageDto {
  @ApiProperty({ description: 'ID priestoru dokumentácie' })
  @IsString()
  @IsNotEmpty()
  spaceId: string;

  @ApiProperty({ required: false, description: 'ID nadradenej stránky pre stromové vnorenie' })
  @IsOptional()
  @IsString()
  parentPageId?: string;

  @ApiProperty({ example: 'Špecifikácia SSR / DOMS synchronizácie' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ required: false, example: '# Úvod do SSR\nDetailný popis procesu...' })
  @IsOptional()
  @IsString()
  content?: string;

  @ApiProperty({ required: false, example: '📄' })
  @IsOptional()
  @IsString()
  icon?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  coverUrl?: string;

  @ApiProperty({ required: false, example: ['WET', 'SSR', 'Architektúra'] })
  @IsOptional()
  @IsArray()
  tags?: string[];
}

export class UpdateDocPageDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  content?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  icon?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  coverUrl?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  parentPageId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsInt()
  orderIndex?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsArray()
  tags?: string[];

  @ApiProperty({ required: false, description: 'Poznámka k revízii / zmenám' })
  @IsOptional()
  @IsString()
  changeSummary?: string;
}
