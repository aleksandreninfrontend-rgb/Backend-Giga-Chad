import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { ClsServiceManager } from 'nestjs-cls';
import type { Request, Response } from 'express';
import type { ErrorResponse } from './error-response.js';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    if (host.getType() !== 'http') {
      this.logger.error({
        msg: 'Unhandled non-HTTP exception',
        contextType: host.getType(),
        error: exception instanceof Error ? exception.message : exception,
      });
      return;
    }

    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const statusCode =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const exceptionResponse =
      exception instanceof HttpException ? exception.getResponse() : null;

    let message: string | string[] = 'Internal server error';
    let error = HttpStatus[statusCode] ?? 'Error';

    if (typeof exceptionResponse === 'string') {
      message = exceptionResponse;
    } else if (
      exceptionResponse &&
      typeof exceptionResponse === 'object' &&
      'message' in exceptionResponse
    ) {
      const body = exceptionResponse as {
        message?: string | string[];
        error?: string;
      };
      message = body.message ?? message;
      error = body.error ?? error;
    }

    let requestId: string | undefined;
    try {
      requestId = ClsServiceManager.getClsService().getId();
    } catch {
      requestId = undefined;
    }

    if (!(exception instanceof HttpException)) {
      this.logger.error({
        msg: 'Unhandled HTTP exception',
        requestId,
        path: request.url,
        method: request.method,
        error:
          exception instanceof Error ? exception.message : String(exception),
        stack: exception instanceof Error ? exception.stack : undefined,
      });
    }

    const body: ErrorResponse = {
      statusCode,
      message,
      error,
      requestId,
      timestamp: new Date().toISOString(),
      path: request.url,
    };

    response.status(statusCode).json(body);
  }
}
