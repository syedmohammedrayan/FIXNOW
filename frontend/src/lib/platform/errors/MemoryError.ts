import { AppError } from './AppError';

export class MemoryError extends AppError {
  constructor(message: string, code: string = 'MEMORY_OPERATION_FAILED') {
    super(message, code, 500, true);
  }
}
