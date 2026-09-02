import {
  Controller,
  Post,
  Param,
  UseInterceptors,
  UploadedFile,
  Body,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { ExcelImportService } from './excel-import.service';
import { PreviewMappingDto, ExecuteImportDto } from './dto/excel-import.dto';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { CurrentUser } from '@/common/decorators/current-user.decorator';

@ApiTags('Excel Import Workbench (XLSX Parser & Column Mapper)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('excel-import')
export class ExcelImportController {
  constructor(private readonly excelImportService: ExcelImportService) {}

  @Post('upload/project/:projectId')
  @ApiOperation({ summary: 'Krok 1: Nahratie starého Excel súboru s testami a heuristická detekcia stĺpcov' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  async upload(
    @Param('projectId') projectId: string,
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser('id') userId: string,
  ) {
    if (!file) {
      throw new BadRequestException('Nebol nahraný žiadny súbor');
    }
    return this.excelImportService.uploadFile(projectId, file, userId);
  }

  @Post('preview')
  @ApiOperation({ summary: 'Krok 2: Vizuálny náhľad namapovaných stĺpcov pred importom' })
  async preview(@Body() dto: PreviewMappingDto) {
    return this.excelImportService.previewMapping(dto);
  }

  @Post('execute')
  @ApiOperation({ summary: 'Krok 3: Finálny import testovacích scenárov a krokov do databázy' })
  async execute(@Body() dto: ExecuteImportDto, @CurrentUser('id') userId: string) {
    return this.excelImportService.executeImport(dto, userId);
  }
}
