import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand, GetObjectCommand, CreateBucketCommand, HeadBucketCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

@Injectable()
export class S3StorageService implements OnModuleInit {
  private readonly logger = new Logger(S3StorageService.name);
  private s3Client: S3Client;
  private bucketName: string;

  constructor(private readonly configService: ConfigService) {
    const endpoint = this.configService.get<string>('S3_ENDPOINT') || 'localhost';
    const port = this.configService.get<string>('S3_PORT') || '9000';
    const useSSL = this.configService.get<string>('S3_USE_SSL') === 'true';

    this.bucketName = this.configService.get<string>('S3_BUCKET_NAME') || 'test-attachments';

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
      } catch (err) {
        this.logger.warn(`Nepodarilo sa inicializovať S3 bucket (môže bežať neskôr cez docker): ${err.message}`);
      }
    }
  }

  async uploadFile(key: string, buffer: Buffer, mimeType: string) {
    await this.s3Client.send(
      new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        Body: buffer,
        ContentType: mimeType,
      }),
    );
    return key;
  }

  async getPresignedUrl(key: string, expiresInSeconds = 3600): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    });
    return getSignedUrl(this.s3Client, command, { expiresIn: expiresInSeconds });
  }
}
