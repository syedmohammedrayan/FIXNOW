import { Logger } from './logger';

export interface AILogContext {
  requestId: string;
  provider: 'groq' | 'cascadeflow' | 'hindsight';
  model?: string;
  durationMs: number;
  memoryHits?: number;
  cacheHit: boolean;
  status: 'success' | 'failed';
}

export class AILogger {
  static logExecution(context: AILogContext) {
    Logger.info(`AI Execution Completed: ${context.provider}`, {
      type: 'ai_execution',
      ...context
    });
  }
}
