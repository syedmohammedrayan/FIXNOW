import { AIRequest } from '../interfaces/request';
import { AIResponse } from '../interfaces/response';
import { GatewayLogger } from '../gateway/gateway.logger';

export function withLogging(
  request: AIRequest, 
  handler: (req: AIRequest) => Promise<AIResponse>
): Promise<AIResponse> {
  GatewayLogger.logRequest(request);
  
  return handler(request)
    .then(response => {
      GatewayLogger.logResponse(response, request);
      return response;
    })
    .catch(error => {
      GatewayLogger.logError(request.requestId, error);
      throw error;
    });
}
