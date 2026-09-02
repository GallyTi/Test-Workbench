import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { S3StorageService } from './s3-storage.service';
import { randomUUID } from 'crypto';

@Injectable()
export class AttachmentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly s3Service: S3StorageService,
  ) {}

  async uploadAttachment(
    targetType: 'STEP_EXECUTION' | 'TEST_CASE' | 'BUG',
    targetId: string,
    file: Express.Multer.File,
    userId: string,
  ) {
    const fileExt = file.originalname.split('.').pop();
    const storageKey = `${targetType.toLowerCase()}/${targetId}/${randomUUID()}.${fileExt}`;

    await this.s3Service.uploadFile(storageKey, file.buffer, file.mimetype);

    const attachment = await this.prisma.attachment.create({
      data: {
        targetType,
        targetId,
        fileName: file.originalname,
        fileSizeBytes: BigInt(file.size),
        mimeType: file.mimetype,
        storageKey,
        uploadedById: userId,
      },
      include: {
        uploadedBy: { select: { id: true, fullName: true, email: true } },
      },
    });

    // Ak je príloha naviazaná na krok exekúcie, aktualizujeme čas a posledného upravujúceho
    if (targetType === 'STEP_EXECUTION') {
      await this.prisma.testStepExecution.update({
        where: { id: targetId },
        data: {
          lastModifiedById: userId,
          updatedAt: new Date(),
        },
      });
    }

    const downloadUrl = await this.s3Service.getPresignedUrl(storageKey);

    return {
      id: attachment.id,
      targetType: attachment.targetType,
      targetId: attachment.targetId,
      fileName: attachment.fileName,
      fileSizeBytes: Number(attachment.fileSizeBytes),
      mimeType: attachment.mimeType,
      downloadUrl,
      uploadedBy: attachment.uploadedBy,
      createdAt: attachment.createdAt,
    };
  }

  async getAttachmentsForTarget(targetType: string, targetId: string) {
    const items = await this.prisma.attachment.findMany({
      where: { targetType, targetId },
      include: {
        uploadedBy: { select: { id: true, fullName: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return Promise.all(
      items.map(async (item) => ({
        id: item.id,
        fileName: item.fileName,
        fileSizeBytes: Number(item.fileSizeBytes),
        mimeType: item.mimeType,
        downloadUrl: await this.s3Service.getPresignedUrl(item.storageKey),
        uploadedBy: item.uploadedBy,
        createdAt: item.createdAt,
      })),
    );
  }
}
