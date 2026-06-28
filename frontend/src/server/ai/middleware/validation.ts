import { AIRequest } from '../interfaces/request';
import { ValidationError } from '../gateway/gateway.errors';

export function validateRequest(request: Partial<AIRequest>): asserts request is AIRequest {
  if (!request.requestId) throw new ValidationError('requestId is required');
  if (!request.userId) throw new ValidationError('userId is required');
  if (!request.sessionId) throw new ValidationError('sessionId is required');
  if (!request.agent) throw new ValidationError('agent is required');
  if (!Array.isArray(request.messages) || request.messages.length === 0) {
    throw new ValidationError('messages array must not be empty');
  }
}
