import { Module } from '@nestjs/common';
import { ExcelImportService } from './excel-import.service';
import { ExcelImportController } from './excel-import.controller';
import { AttachmentsModule } from '../attachments/attachments.module';

@Module({
  imports: [AttachmentsModule],
  providers: [ExcelImportService],
  controllers: [ExcelImportController],
  exports: [ExcelImportService],
})
export class ExcelImportModule {}
