import { Module } from '@nestjs/common';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import {
  AccessTokenGuard,
  AllExceptionsFilter,
  CommonLoggerModule,
  RolesGuard,
} from '@app/common';
import { PrismaModule } from './prisma/prisma.module.js';
import { UsersModule } from './features/users/users.module.js';
import { AuthModule } from './auth/auth.module.js';
import { RedisModule } from './providers/cache/redis.module.js';
import { ScheduleModule } from '@nestjs/schedule';
import { AvatarCleanupModule } from './features/avatar-cleanup/avatar-cleanup.module.js';
import { OutboxCleanupModule } from './features/outbox-cleanup/outbox-cleanup.module.js';
import { BullModule } from '@nestjs/bull';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    CommonLoggerModule,
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        redis: config.get('REDIS_URL', 'redis://localhost:6379'),
      }),
    }),
    ScheduleModule.forRoot(),
    AvatarCleanupModule,
    OutboxCleanupModule,
    RedisModule,
    PrismaModule,
    UsersModule,
    AuthModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: AccessTokenGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
  ],
})
export class AppModule {}
