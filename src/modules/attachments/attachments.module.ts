import { Module } from '@nestjs/common';
import { AttachmentsService } from './attachments.service';
import { AttachmentsController } from './attachments.controller';
import { S3StorageService } from './s3-storage.service';

@Module({
  providers: [AttachmentsService, S3StorageService],
  controllers: [AttachmentsController],
  exports: [AttachmentsService, S3StorageService],
})
export class AttachmentsModule {}
