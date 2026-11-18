import { Module, type ExecutionContext } from '@nestjs/common';
import { LoggerModule } from 'nestjs-pino';
import { randomUUID } from 'node:crypto';
import { ClsModule, ClsServiceManager } from 'nestjs-cls';
import { IncomingMessage, ServerResponse } from 'node:http';
import type { Request } from 'express';
import { resolveRequestId } from './resolve-request-id.js';

function clsRequestIdMixin(): { requestId?: string } {
  try {
    const cls = ClsServiceManager.getClsService();
    if (!cls.isActive()) {
      return {};
    }
    const requestId = cls.getId();
    return requestId ? { requestId } : {};
  } catch {
    return {};
  }
}

function requestIdFromRpcContext(context: ExecutionContext): string {
  const data: unknown = context.switchToRpc().getData();
  if (data && typeof data === 'object') {
    const record = data as Record<string, unknown>;
    return resolveRequestId(record.requestId, resolveRequestId(record.eventId));
  }
  return randomUUID();
}

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
          return resolveRequestId(fromHeader);
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
        mixin: clsRequestIdMixin,
        redact: ['req.headers.authorization', 'req.headers.cookie'],
      },
      microservice: {
        genReqId: (context) => requestIdFromRpcContext(context),
        customProps: () => clsRequestIdMixin(),
      },
    }),
  ],
})
export class CommonLoggerModule {}
