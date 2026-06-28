import { AppError } from './AppError';

export class AIError extends AppError {
  constructor(message: string, code: string = 'AI_GENERATION_FAILED') {
    super(message, code, 502, true);
  }
}
