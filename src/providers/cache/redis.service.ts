import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { Redis } from 'ioredis';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private readonly client: Redis;

  constructor(config: ConfigService) {
    this.client = new Redis(config.getOrThrow<string>('REDIS_URL'), {
      enableOfflineQueue: false,
      commandTimeout: 1000,
    });
  }

  async get(key: string): Promise<string | null> {
    try {
      return await this.client.get(key);
    } catch (err) {
      this.logger.warn({
        msg: 'Redis GET failed',
        key,
        error: err instanceof Error ? err.message : String(err),
      });
      return null;
    }
  }

  async set(key: string, value: string, ttlSeconds: number): Promise<void> {
    try {
      await this.client.set(key, value, 'EX', ttlSeconds);
    } catch (err) {
      this.logger.warn({
        msg: 'Redis SET failed',
        key,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  async del(key: string): Promise<void> {
    try {
      await this.client.del(key);
    } catch (err) {
      this.logger.warn({
        msg: 'Redis DEL failed',
        key,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  async incr(key: string): Promise<number> {
    try {
      return await this.client.incr(key);
    } catch (err) {
      this.logger.warn({
        msg: 'Redis INCR failed',
        key,
        error: err instanceof Error ? err.message : String(err),
      });
      return 0;
    }
  }

  async onModuleDestroy() {
    await this.client.quit();
  }

  async acquireLock(key: string, ttlSeconds: number): Promise<boolean> {
    try {
      const result = await this.client.set(key, '1', 'EX', ttlSeconds, 'NX');
      return result === 'OK';
    } catch (err) {
      this.logger.warn({
        msg: 'Redis acquireLock failed',
        key,
        error: String(err),
      });
      return false;
    }
  }

  async releaseLock(key: string): Promise<void> {
    try {
      await this.client.del(key);
    } catch (err) {
      this.logger.warn({
        msg: 'Redis releaseLock failed',
        key,
        error: String(err),
      });
    }
  }
}
