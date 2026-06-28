import { Logger } from './logger';

export interface RequestLogContext {
  requestId: string;
  workflow: string;
  userId: string;
  durationMs: number;
  status: 'success' | 'partial' | 'failed';
}

export class RequestLogger {
  static logIncoming(requestId: string, workflow: string, userId: string, payload: any) {
    Logger.info(`Incoming Request: ${workflow}`, {
      type: 'request_start',
      requestId,
      workflow,
      userId,
      payloadSize: JSON.stringify(payload).length
    });
  }

  static logCompletion(context: RequestLogContext) {
    Logger.info(`Request Completed: ${context.workflow} (${context.status})`, {
      type: 'request_complete',
      ...context
    });
  }
}
