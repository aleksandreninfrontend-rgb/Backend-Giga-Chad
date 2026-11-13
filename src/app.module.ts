import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module.js';
import { UsersModule } from './features/users/users.module.js';
import { AuthModule } from './auth/auth.module.js';
import { JwtAuthModule } from './auth/jwt-auth.module.js';
import { AccessTokenGuard } from './auth/guards/access-token.guard.js';
import { RolesGuard } from './auth/guards/roles-guard.js';
import { RedisModule } from './providers/cache/redis.module.js';
import { ScheduleModule } from '@nestjs/schedule';
import { AvatarCleanupModule } from './features/avatar-cleanup/avatar-cleanup.module.js';
import { LoggerModule } from 'nestjs-pino';
import { randomUUID } from 'node:crypto';
import { ClsModule, ClsServiceManager } from 'nestjs-cls';
import { IncomingMessage, ServerResponse } from 'node:http';
import type { Request } from 'express';
import { BullModule } from '@nestjs/bull';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ClsModule.forRoot({
      global: true,
      middleware: {
        mount: true,
        generateId: true,
        idGenerator: (req: Request) => {
          const incoming = req.headers['x-request-id'];
          const fromHeader = Array.isArray(incoming) ? incoming[0] : incoming;
          return fromHeader?.trim() || randomUUID();
        },
      },
    }),
    LoggerModule.forRoot({
      pinoHttp: {
        genReqId: (_req: IncomingMessage, res: ServerResponse) => {
          const id = ClsServiceManager.getClsService().getId();
          res.setHeader('x-request-id', id);
          return id;
        },
        redact: ['req.headers.authorization', 'req.headers.cookie'],
      },
    }),
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        redis: config.get('REDIS_URL', 'redis://localhost:6379'),
      }),
    }),
    ScheduleModule.forRoot(),
    AvatarCleanupModule,
    RedisModule,
    PrismaModule,
    UsersModule,
    AuthModule,
    JwtAuthModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: AccessTokenGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {}
