import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { translateValidationMessages } from '../pipes/validation-message.pipe';

interface ErrorResponse {
  success: false;
  statusCode: number;
  error: string;
  message: string | string[];
  path: string;
  timestamp: string;
}

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let statusCode: number;
    let message: string | string[];
    let error: string;

    if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        const responseObj = exceptionResponse as Record<string, unknown>;
        message =
          (responseObj.message as string | string[]) || exception.message;
        error = (responseObj.error as string) || this.getErrorName(statusCode);
      } else {
        message = exception.message;
        error = this.getErrorName(statusCode);
      }
    } else if (exception instanceof Error) {
      statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
      message = 'Internal server error';
      error = 'Internal Server Error';

      this.logger.error(
        `Unhandled exception: ${exception.message}`,
        exception.stack,
      );
    } else {
      statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
      message = 'Internal server error';
      error = 'Internal Server Error';

      this.logger.error('Unknown exception type', String(exception));
    }

    const errorResponse: ErrorResponse = {
      success: false,
      statusCode,
      error: this.translateErrorName(error),
      message: translateValidationMessages(message),
      path: request.url,
      timestamp: new Date().toISOString(),
    };

    response.status(statusCode).json(errorResponse);
  }

  private getErrorName(statusCode: number): string {
    const errorNames: Record<number, string> = {
      400: 'Bad Request',
      401: 'Unauthorized',
      403: 'Forbidden',
      404: 'Not Found',
      409: 'Conflict',
      422: 'Unprocessable Entity',
      429: 'Too Many Requests',
      500: 'Internal Server Error',
    };

    return errorNames[statusCode] || 'Error';
  }

  private translateErrorName(error: string): string {
    const translations: Record<string, string> = {
      'Bad Request': 'Ошибка в данных',
      'Unauthorized': 'Требуется авторизация',
      'Forbidden': 'Доступ запрещён',
      'Not Found': 'Не найдено',
      'Conflict': 'Конфликт данных',
      'Unprocessable Entity': 'Некорректные данные',
      'Too Many Requests': 'Слишком много запросов',
      'Internal Server Error': 'Внутренняя ошибка сервера',
    };

    return translations[error] || error;
  }
}
