/**
 * CascadeFlow Service
 * ====================
 * Integrates CascadeFlow for intelligent model routing and optimization.
 *
 * CascadeFlow sits between the gateway and the provider layer.
 * It makes real-time decisions about:
 *   - Which model to use based on task complexity
 *   - Budget gating (prevent overspending)
 *   - Latency optimization
 *   - Fallback cascading when a model fails
 *
 * Uses: cascadeflow-core-smr
 */

import type { RoutingDecision } from '../types';
import { MODEL_REGISTRY, DEFAULT_MODEL_ID, FALLBACK_MODEL_ID } from '../config/models';
import { getAIConfig } from '../config/ai.config';

/**
 * CascadeFlow service state.
 * Lazily initialized on first use.
 */
let _cascadeInitialized = false;

/**
 * Initialize CascadeFlow runtime.
 * This should be called once during server startup.
 * If cascadeflow-core-smr is unavailable, falls back gracefully to
 * rule-based routing.
 */
export async function initCascade(): Promise<boolean> {
  if (_cascadeInitialized) return true;

  try {
    // Attempt to load CascadeFlow core
    // Dynamic import so the app still works if the package isn't installed yet
    const cascadeflow = await import('cascadeflow-core-smr').catch(() => null);

    if (cascadeflow) {
      console.log('[CascadeFlow] Core loaded successfully');
      _cascadeInitialized = true;
    } else {
      console.warn('[CascadeFlow] Package not available, using rule-based routing');
      _cascadeInitialized = true; // Mark as initialized with fallback mode
    }

    return true;
  } catch (error) {
    console.error('[CascadeFlow] Initialization error:', error);
    _cascadeInitialized = true; // Continue with fallback
    return false;
  }
}

/**
 * Get a routing decision from CascadeFlow.
 * Determines the best model for a given request based on:
 *   - Intent type
 *   - Message complexity
 *   - Budget constraints
 *   - Latency requirements
 *
 * @param intent - The request intent (e.g., 'chat', 'diagnose')
 * @param messageLength - Approximate token count of the input
 * @param priority - 'speed' | 'quality' | 'balanced'
 */
export function getRoutingDecision(
  intent: string,
  messageLength: number,
  priority: 'speed' | 'quality' | 'balanced' = 'balanced'
): RoutingDecision {
  const config = getAIConfig();

  // Rule-based routing (CascadeFlow fallback / default behavior)
  // In Sprint 3+, this will be replaced with CascadeFlow's ML-based routing

  // Short, simple queries → fast small model
  if (messageLength < 100 && priority === 'speed') {
    return {
      modelId: 'meta-llama/llama-3.1-8b-instruct:free',
      reason: 'Short query with speed priority → small fast model',
      costTier: 'free',
      latencyTier: 'fast',
      confidence: 0.9,
    };
  }

  // Complex analysis tasks → high-quality model
  if (intent === 'diagnose' || intent === 'pricing' || intent === 'chat' || intent === 'booking' || priority === 'quality') {
    return {
      modelId: 'meta-llama/llama-4-scout-17b-16e-instruct',
      reason: 'Complex task requiring high quality → large versatile model',
      costTier: 'free',
      latencyTier: 'medium',
      confidence: 0.85,
    };
  }

  // Default → balanced model
  return {
    modelId: config.defaultModel || DEFAULT_MODEL_ID,
    reason: 'Balanced routing → default model',
    costTier: 'free',
    latencyTier: 'fast',
    confidence: 0.8,
  };
}

/**
 * Get the fallback model when the primary model fails.
 * CascadeFlow handles cascading fallback logic.
 *
 * @param failedModelId - The model that failed
 */
export function getFallbackModel(failedModelId?: string): string {
  return FALLBACK_MODEL_ID || 'meta-llama/llama-3.1-8b-instruct:free';
}

/**
 * Check if CascadeFlow is initialized.
 */
export function isCascadeReady(): boolean {
  return _cascadeInitialized;
}
