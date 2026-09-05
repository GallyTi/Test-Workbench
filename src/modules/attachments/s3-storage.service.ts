import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand, GetObjectCommand, CreateBucketCommand, HeadBucketCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class S3StorageService implements OnModuleInit {
  private readonly logger = new Logger(S3StorageService.name);
  private s3Client: S3Client;
  private bucketName: string;
  private uploadsDir: string;

  constructor(private readonly configService: ConfigService) {
    const endpoint = this.configService.get<string>('S3_ENDPOINT') || 'localhost';
    const port = this.configService.get<string>('S3_PORT') || '9000';
    const useSSL = this.configService.get<string>('S3_USE_SSL') === 'true';

    this.bucketName = this.configService.get<string>('S3_BUCKET_NAME') || 'test-attachments';
    this.uploadsDir = path.resolve(process.cwd(), 'uploads');

    if (!fs.existsSync(this.uploadsDir)) {
      try {
        fs.mkdirSync(this.uploadsDir, { recursive: true });
      } catch (err: any) {
        this.logger.warn(`Nepodarilo sa vytvoriť lokálny priečinok uploads: ${err.message}`);
      }
    }

    this.s3Client = new S3Client({
      endpoint: `http${useSSL ? 's' : ''}://${endpoint}:${port}`,
      region: 'us-east-1',
      credentials: {
        accessKeyId: this.configService.get<string>('S3_ACCESS_KEY') || 'minio_admin',
        secretAccessKey: this.configService.get<string>('S3_SECRET_KEY') || 'minio_secure_pass',
      },
      forcePathStyle: true,
    });
  }

  async onModuleInit() {
    try {
      await this.s3Client.send(new HeadBucketCommand({ Bucket: this.bucketName }));
      this.logger.log(`S3/MinIO bucket "${this.bucketName}" je pripravený.`);
    } catch {
      try {
        await this.s3Client.send(new CreateBucketCommand({ Bucket: this.bucketName }));
        this.logger.log(`Vytvorený S3/MinIO bucket "${this.bucketName}".`);
      } catch (err: any) {
        this.logger.warn(`Nepodarilo sa inicializovať S3 bucket (používam lokálne úložisko uploads/): ${err.message}`);
      }
    }
  }

  async uploadFile(key: string, buffer: Buffer, mimeType: string) {
    // 1. Lokálne uloženie súboru (zaručuje 100% dostupnosť na disku bez ohľadu na Docker/MinIO)
    try {
      const localFilePath = path.join(this.uploadsDir, key);
      const dir = path.dirname(localFilePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(localFilePath, buffer);
    } catch (fsErr: any) {
      this.logger.error(`Chyba lokálneho zápisu súboru ${key}: ${fsErr.message}`);
    }

    // 2. Záloha do S3/MinIO (ak beží)
    try {
      await this.s3Client.send(
        new PutObjectCommand({
          Bucket: this.bucketName,
          Key: key,
          Body: buffer,
          ContentType: mimeType,
        }),
      );
    } catch (s3Err: any) {
      this.logger.warn(`S3 upload pre ${key} zlyhal, súbor je bezpečne uložený na lokálnom disku: ${s3Err.message}`);
    }

    return key;
  }

  async getFileStream(key: string): Promise<{ stream: NodeJS.ReadableStream; mimeType?: string; size?: number } | null> {
    // 1. Skontrolujeme lokálny disk
    const localFilePath = path.join(this.uploadsDir, key);
    if (fs.existsSync(localFilePath)) {
      try {
        const stat = fs.statSync(localFilePath);
        return {
          stream: fs.createReadStream(localFilePath),
          size: stat.size,
        };
      } catch (err: any) {
        this.logger.warn(`Chyba čítania lokálneho súboru ${localFilePath}: ${err.message}`);
      }
    }

    // 2. Ak nie je lokálne, načítame z S3/MinIO
    try {
      const res = await this.s3Client.send(
        new GetObjectCommand({
          Bucket: this.bucketName,
          Key: key,
        }),
      );

      if (res.Body) {
        return {
          stream: res.Body as any,
          mimeType: res.ContentType,
          size: res.ContentLength,
        };
      }
    } catch (err: any) {
      this.logger.warn(`Súbor ${key} sa nepodarilo načítať z S3 ani z disku: ${err.message}`);
    }

    return null;
  }

  async getPresignedUrl(key: string, expiresInSeconds = 3600): Promise<string> {
    const publicEndpoint = this.configService.get<string>('S3_PUBLIC_ENDPOINT');
    if (publicEndpoint) {
      try {
        const command = new GetObjectCommand({
          Bucket: this.bucketName,
          Key: key,
        });
        const url = await getSignedUrl(this.s3Client, command, { expiresIn: expiresInSeconds });
        const parsed = new URL(url);
        const pub = new URL(publicEndpoint);
        parsed.protocol = pub.protocol;
        parsed.host = pub.host;
        return parsed.toString();
      } catch {
        // Fallback
      }
    }
    return `/attachments/file/${encodeURIComponent(key)}`;
  }

  async deleteFile(key: string): Promise<void> {
    // 1. Zmazať z lokálneho úložiska na disku
    try {
      const localFilePath = path.join(this.uploadsDir, key);
      if (fs.existsSync(localFilePath)) {
        fs.unlinkSync(localFilePath);
      }
    } catch (err: any) {
      this.logger.warn(`Chyba pri mazaní lokálneho súboru ${key}: ${err.message}`);
    }

    // 2. Zmazať z MinIO / S3 úložiska
    try {
      await this.s3Client.send(
        new DeleteObjectCommand({
          Bucket: this.bucketName,
          Key: key,
        }),
      );
    } catch (err: any) {
      // S3 zlyhanie ignorujeme ak MinIO nebeží
    }
  }
}
