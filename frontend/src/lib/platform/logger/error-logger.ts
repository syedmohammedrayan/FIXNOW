import { Logger } from './logger';
import { AppError } from '../errors';

export class ErrorLogger {
  static logError(error: Error, requestId?: string, userId?: string) {
    if (error instanceof AppError) {
      Logger.error(`[${error.code}] ${error.message}`, {
        type: 'app_error',
        code: error.code,
        statusCode: error.statusCode,
        isOperational: error.isOperational,
        requestId,
        userId,
        stack: error.stack
      });
    } else {
      Logger.error(`Unhandled Error: ${error.message}`, {
        type: 'unhandled_error',
        name: error.name,
        requestId,
        userId,
        stack: error.stack
      });
    }
  }
}
