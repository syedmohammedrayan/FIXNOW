/**
 * Router Service
 * ===============
 * Handles request routing with retry and fallback logic.
 * Sits between the runtime service and the provider layer.
 *
 * Responsibilities:
 *   - Select model via CascadeFlow
 *   - Retry on transient failures
 *   - Cascade to fallback models
 *   - Track routing metrics
 */

import { getProvider } from '../providers/provider.factory';
import { getRoutingDecision, getFallbackModel } from './cascade.service';
import { getAIConfig } from '../config/ai.config';
import { getModelDefinition } from '../config/models';
import type { RuntimeContext, RuntimeResult } from '../types';

/**
 * Routes a request to the best model and executes it.
 * Handles retries and fallback cascading automatically.
 *
 * Flow:
 *   1. CascadeFlow picks the best model
 *   2. Execute via selected provider
 *   3. On failure → retry with same model
 *   4. On repeated failure → cascade to fallback model
 *
 * @param context - The runtime context with messages and settings
 * @returns The runtime result
 */
export async function routeAndExecute(
  context: RuntimeContext
): Promise<RuntimeResult> {
  const config = getAIConfig();
  const maxRetries = config.maxRetries;
  let currentModelId = context.modelId;
  let totalRetries = 0;
  let usedFallback = false;

  // Try up to maxRetries times, cascading to fallback models
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const modelDef = getModelDefinition(currentModelId);
      const providerName = modelDef.provider;
      const provider = getProvider(providerName);
      
      const start = Date.now();
      const response = await provider.chat(currentModelId, context.messages);
      const latencyMs = Date.now() - start;

      return {
        text: response.content || '',
        modelUsed: response.model || currentModelId,
        provider: providerName,
        usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
        latencyMs,
        retries: totalRetries,
        usedFallback,
      };
    } catch (error) {
      totalRetries++;
      console.warn(
        `[Router] Attempt ${attempt + 1} failed for model ${currentModelId}:`,
        error instanceof Error ? error.message : error
      );

      // If we've exhausted retries with this model, try fallback
      if (attempt < maxRetries) {
        const fallbackId = getFallbackModel(currentModelId);
        if (fallbackId !== currentModelId) {
          console.log(`[Router] Cascading to fallback model: ${fallbackId}`);
          currentModelId = fallbackId;
          usedFallback = true;
        }
      }
    }
  }

  // All attempts exhausted — return error result
  return {
    text: 'I apologize, but I am temporarily unable to process your request. Please try again in a moment.',
    modelUsed: currentModelId,
    provider: 'unknown',
    usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
    latencyMs: 0,
    retries: totalRetries,
    usedFallback,
  };
}
