import { AppError } from './AppError';

export class ExternalAPIError extends AppError {
  constructor(message: string, code: string = 'EXTERNAL_API_FAILED', statusCode: number = 502) {
    super(message, code, statusCode, true);
  }
}
