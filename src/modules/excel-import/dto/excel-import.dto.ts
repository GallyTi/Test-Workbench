import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsObject, IsOptional } from 'class-validator';

export class PreviewMappingDto {
  @ApiProperty({ example: 'uuid-import-job-id' })
  @IsString()
  @IsNotEmpty()
  jobId: string;

  @ApiProperty({ example: 'Sheet1', required: false })
  @IsOptional()
  @IsString()
  sheetName?: string;

  @ApiProperty({
    example: {
      code: 'A',
      title: 'B',
      preconditions: 'C',
      stepNumber: 'D',
      action: 'E',
      expectedResult: 'F',
      testData: 'G',
    },
    description: 'Mapovanie interných polí na písmená stĺpcov v Excely',
  })
  @IsObject()
  columnMapping: Record<string, string>;
}

export class ExecuteImportDto {
  @ApiProperty({ example: 'uuid-import-job-id' })
  @IsString()
  @IsNotEmpty()
  jobId: string;

  @ApiProperty({ required: false, description: 'Cieľová testovacia sada' })
  @IsOptional()
  @IsString()
  suiteId?: string;

  @ApiProperty({ required: false, description: 'Cieľový epic' })
  @IsOptional()
  @IsString()
  epicId?: string;
}
