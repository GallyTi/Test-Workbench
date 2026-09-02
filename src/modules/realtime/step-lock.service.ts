import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class StepLockService {
  private readonly logger = new Logger(StepLockService.name);
  private redisClient: Redis;

  constructor(private readonly configService: ConfigService) {
    const host = this.configService.get<string>('REDIS_HOST') || 'localhost';
    const port = Number(this.configService.get<string>('REDIS_PORT')) || 6379;
    this.redisClient = new Redis({ host, port });
  }

  async acquireLock(stepExecutionId: string, userId: string, userName: string, ttlSeconds = 120): Promise<{ acquired: boolean; lockedBy?: { userId: string; userName: string } }> {
    const key = `lock:step:${stepExecutionId}`;
    const value = JSON.stringify({ userId, userName, lockedAt: new Date().toISOString() });

    // Set NX (only if not exists) s TTL
    const result = await this.redisClient.set(key, value, 'EX', ttlSeconds, 'NX');

    if (result === 'OK') {
      return { acquired: true };
    }

    // Ak už zámok existuje, zistíme kto ho drží
    const existing = await this.redisClient.get(key);
    const lockedBy = existing ? JSON.parse(existing) : undefined;

    // Ak zámok drží ten istý používateľ, predĺžime TTL
    if (lockedBy && lockedBy.userId === userId) {
      await this.redisClient.expire(key, ttlSeconds);
      return { acquired: true };
    }

    return { acquired: false, lockedBy };
  }

  async releaseLock(stepExecutionId: string, userId: string): Promise<boolean> {
    const key = `lock:step:${stepExecutionId}`;
    const existing = await this.redisClient.get(key);

    if (existing) {
      const lockedBy = JSON.parse(existing);
      if (lockedBy.userId === userId) {
        await this.redisClient.del(key);
        return true;
      }
    }
    return false;
  }

  async getActiveLock(stepExecutionId: string) {
    const key = `lock:step:${stepExecutionId}`;
    const existing = await this.redisClient.get(key);
    return existing ? JSON.parse(existing) : null;
  }
}
