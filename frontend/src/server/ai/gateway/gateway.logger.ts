import { aiLogger } from '../logs/logger';
import { AIRequest } from '../interfaces/request';
import { AIResponse } from '../interfaces/response';

/**
 * Gateway Logger
 * Every request logs: timestamp, requestId, userId, agent, latency, provider, model, status
 */
export class GatewayLogger {
  static logRequest(request: AIRequest) {
    aiLogger.info({
      event: 'AI_REQUEST_START',
      requestId: request.requestId,
      userId: request.userId,
      agent: request.agent,
      timestamp: new Date().toISOString()
    });
  }

  static logResponse(response: AIResponse, originalRequest: AIRequest) {
    aiLogger.info({
      event: 'AI_REQUEST_COMPLETE',
      requestId: response.requestId,
      userId: originalRequest.userId,
      agent: originalRequest.agent,
      latency: response.latency,
      provider: response.provider,
      model: response.model,
      status: response.success ? 'success' : 'failed',
      timestamp: new Date().toISOString()
    });
  }

  static logError(requestId: string, error: Error) {
    aiLogger.error({
      event: 'AI_REQUEST_ERROR',
      requestId,
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
  }
}
