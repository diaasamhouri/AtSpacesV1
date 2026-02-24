import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Redis } from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
    private redisClient: Redis;

    onModuleInit() {
        this.redisClient = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
        console.log('Redis connected for Real-time Availability Locks');
    }

    onModuleDestroy() {
        this.redisClient.quit();
    }

    /**
     * Acquires a lock for a specific meeting room/desk to prevent double booking
     */
    async acquireLock(resourceId: string, ttlSeconds: number): Promise<boolean> {
        const lockKey = `lock:resource:${resourceId}`;
        const acquired = await this.redisClient.set(lockKey, 'LOCKED', 'EX', ttlSeconds, 'NX');
        return acquired === 'OK';
    }

    /**
     * Releases the lock after checkout or expiration
     */
    async releaseLock(resourceId: string): Promise<void> {
        const lockKey = `lock:resource:${resourceId}`;
        await this.redisClient.del(lockKey);
    }
}
