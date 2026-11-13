import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { ClsServiceManager } from 'nestjs-cls';
import type { Request, Response } from 'express';
import type { ErrorResponse } from './error-response.js';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
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
