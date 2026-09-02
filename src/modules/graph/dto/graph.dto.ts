import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional, IsObject } from 'class-validator';

export class CreateGraphObjectDto {
  @ApiProperty({ example: 'SYS_DOMS', description: 'Unikátny kód objektu' })
  @IsString()
  @IsNotEmpty()
  objectId: string;

  @ApiProperty({ example: 'system', description: 'system, interface, process, payload, database' })
  @IsString()
  @IsNotEmpty()
  objectType: string;

  @ApiProperty({ example: 'DOMS Forecourt Controller' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'POS', required: false })
  @IsOptional()
  @IsString()
  domain?: string;

  @ApiProperty({ example: 'confirmed', default: 'draft', required: false })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string;
}

export class CreateGraphRelationshipDto {
  @ApiProperty({ example: 'REL_DOMS_PO' })
  @IsString()
  @IsNotEmpty()
  relationshipId: string;

  @ApiProperty({ example: 'SYS_DOMS' })
  @IsString()
  @IsNotEmpty()
  sourceObjectId: string;

  @ApiProperty({ example: 'SYS_SAP_PO' })
  @IsString()
  @IsNotEmpty()
  targetObjectId: string;

  @ApiProperty({ example: 'sends_to', description: 'communicates_with, sends_to, receives_from, uses, contains' })
  @IsString()
  @IsNotEmpty()
  relationshipType: string;

  @ApiProperty({ example: 'SAP_PO', required: false, description: 'SAP_PO, REST_API, IDoc, SOAP, File' })
  @IsOptional()
  @IsString()
  communicationType?: string;

  @ApiProperty({ example: 'transactional_data', required: false })
  @IsOptional()
  @IsString()
  dataType?: string;
}

export class FindPathDto {
  @ApiProperty({ example: 'SYS_DOMS' })
  @IsString()
  @IsNotEmpty()
  source: string;

  @ApiProperty({ example: 'SYS_SAP_CAR' })
  @IsString()
  @IsNotEmpty()
  target: string;
}
