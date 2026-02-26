import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Redis } from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private redisClient: Redis;
  private readonly logger = new Logger(RedisService.name);

  constructor(private configService: ConfigService) {}

  onModuleInit() {
    const redisUrl =
      this.configService.get<string>('REDIS_URL') || 'redis://localhost:6379';
    this.redisClient = new Redis(redisUrl);
    this.logger.log('Redis connected');
  }

  onModuleDestroy() {
    this.redisClient.quit();
  }

  async acquireLock(resourceId: string, ttlSeconds: number): Promise<boolean> {
    const lockKey = `lock:resource:${resourceId}`;
    const acquired = await this.redisClient.set(
      lockKey,
      'LOCKED',
      'EX',
      ttlSeconds,
      'NX',
    );
    return acquired === 'OK';
  }

  async releaseLock(resourceId: string): Promise<void> {
    const lockKey = `lock:resource:${resourceId}`;
    await this.redisClient.del(lockKey);
  }

  async get(key: string): Promise<string | null> {
    return this.redisClient.get(key);
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (ttlSeconds) {
      await this.redisClient.set(key, value, 'EX', ttlSeconds);
    } else {
      await this.redisClient.set(key, value);
    }
  }

  async del(key: string): Promise<void> {
    await this.redisClient.del(key);
  }
}
