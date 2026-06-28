import { AIRequest } from '../interfaces/request';
import { AIResponse } from '../interfaces/response';
import { OrchestratorService } from '../orchestrator';
import { validateRequest } from '../middleware/validation';
import { authenticateRequest } from '../middleware/authentication';
import { withLogging } from '../middleware/logging';
import { withTimeout } from '../middleware/timeout';
import { GatewayInput, GatewayProcessOptions } from './gateway.types';
import { generateRequestId } from '../utils/requestId';

export class AIGateway {
  constructor(private readonly orchestrator: OrchestratorService) {}

  /**
   * Main entry point for AI requests
   * Follows pipeline: Validation -> Auth -> Logging -> Timeout -> Orchestrator -> Response
   */
  async process(input: GatewayInput, options?: GatewayProcessOptions): Promise<AIResponse> {
    // 1. Assign ID and format request
    const request: AIRequest = {
      requestId: input.requestId || generateRequestId(),
      userId: input.userId || 'anonymous',
      sessionId: input.sessionId || 'default',
      agent: input.agent || 'system',
      messages: input.messages || [],
      attachments: input.attachments || [],
      metadata: input.metadata || {}
    };

    // 2. Pipeline Definition
    const pipeline = async (req: AIRequest): Promise<AIResponse> => {
      // 2a. Validation
      validateRequest(req);

      // 2b. Authentication
      if (!options?.skipAuth) {
        authenticateRequest(req);
      }

      // 2c. Send to Orchestrator
      return await this.orchestrator.processRequest(req);
    };

    // 3. Wrap with Logging and Timeout
    return withLogging(request, (req) => withTimeout(pipeline(req)));
  }
}
