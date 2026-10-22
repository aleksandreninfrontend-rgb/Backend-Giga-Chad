import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
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
import { ClsModule } from 'nestjs-cls';
import { IncomingMessage, ServerResponse } from 'node:http';
import type { Request } from 'express';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    LoggerModule.forRoot({
      pinoHttp: {
        genReqId: (req: IncomingMessage, res: ServerResponse) => {
          const incoming = req.headers['x-request-id'];
          const fromHeader = Array.isArray(incoming) ? incoming[0] : incoming;
          const id = fromHeader?.trim() || randomUUID();
          res.setHeader('x-request-id', id);
          return id;
        },
        redact: ['req.headers.authorization', 'req.headers.cookie'],
      },
    }),
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
