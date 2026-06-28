import { AppError } from './AppError';

export class ValidationError extends AppError {
  public readonly validationErrors: any[];

  constructor(message: string, validationErrors: any[] = []) {
    super(message, 'VALIDATION_ERROR', 400, true);
    this.validationErrors = validationErrors;
  }
}
