import { AIRequest } from '../interfaces/request';
import { AuthenticationError } from '../gateway/gateway.errors';

export function authenticateRequest(request: AIRequest) {
  // Dummy authentication hook
  if (!request.userId) {
    throw new AuthenticationError('Unauthorized: Missing User ID');
  }
}
