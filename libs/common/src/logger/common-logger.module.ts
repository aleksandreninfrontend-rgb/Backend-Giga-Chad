import { Module } from '@nestjs/common';
import { LoggerModule } from 'nestjs-pino';
import { randomUUID } from 'node:crypto';
import { ClsModule, ClsServiceManager } from 'nestjs-cls';
import { IncomingMessage, ServerResponse } from 'node:http';
import type { Request } from 'express';

@Module({
  imports: [
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
  ],
})
export class CommonLoggerModule {}
