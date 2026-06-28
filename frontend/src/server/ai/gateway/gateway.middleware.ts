/**
 * Gateway Middleware
 * ===================
 * Pre-processing middleware for the AI Gateway.
 * Handles request validation, ID generation, and request enrichment
 * before the gateway processes the request.
 */

import { v4 as uuidv4 } from 'uuid';
import { safeValidateAIRequest, type AIRequestBody } from '../middleware/request-validator';
import { logRequest } from '../middleware/logger';
import type { GatewayRequest } from '../types';

/**
 * Process a raw API request body into a validated GatewayRequest.
 * This is the first step in the gateway pipeline.
 *
 * @param rawBody - The raw JSON body from the API route
 * @returns Validated gateway request or error
 */
export function processIncomingRequest(rawBody: unknown): {
  success: boolean;
  request?: GatewayRequest;
  error?: string;
} {
  // Step 1: Validate the request body
  const validation = safeValidateAIRequest(rawBody);
  if (!validation.success || !validation.data) {
    return {
      success: false,
      error: validation.error ?? 'Invalid request body',
    };
  }

  const body = validation.data;

  // Step 2: Generate a unique request ID
  const requestId = uuidv4();

  // Step 3: Build the gateway request
  const gatewayRequest: GatewayRequest = {
    requestId,
    intent: body.intent,
    message: body.message,
    history: body.history,
    userId: body.userId,
    sessionId: body.sessionId,
    modelId: body.modelId,
    metadata: body.metadata,
  };

  // Step 4: Log the incoming request
  logRequest('POST', '/api/ai', requestId, { intent: body.intent });

  return {
    success: true,
    request: gatewayRequest,
  };
}
