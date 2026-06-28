/**
 * Model Registry
 * ===============
 * Defines all available LLM models, their capabilities, and metadata.
 * The runtime layer uses this registry to select the best model
 * based on task requirements (speed, quality, cost).
 *
 * All models are accessed through Groq via the Vercel AI SDK.
 */

export interface ModelDefinition {
  /** Model identifier used by the provider */
  id: string;
  /** Human-readable display name */
  name: string;
  /** Provider that hosts this model */
  provider: 'groq' | 'openrouter' | 'gemini';
  /** Maximum context window in tokens */
  contextWindow: number;
  /** Cost tier for budget decisions */
  costTier: 'free' | 'low' | 'medium' | 'high';
  /** Speed tier for latency-sensitive tasks */
  speedTier: 'fast' | 'medium' | 'slow';
  /** Quality tier for accuracy-sensitive tasks */
  qualityTier: 'standard' | 'high' | 'premium';
  /** Whether this model supports tool/function calling */
  supportsTools: boolean;
  /** Whether this model supports streaming */
  supportsStreaming: boolean;
  /** Use cases this model excels at */
  bestFor: string[];
}

/**
 * Registry of all available models.
 * CascadeFlow uses this to make intelligent routing decisions.
 */
export const MODEL_REGISTRY: Record<string, ModelDefinition> = {
  'meta-llama/llama-4-scout-17b-16e-instruct': {
    id: 'meta-llama/llama-4-scout-17b-16e-instruct',
    name: 'Llama 4 Scout',
    provider: 'groq',
    contextWindow: 128000,
    costTier: 'free',
    speedTier: 'fast',
    qualityTier: 'premium',
    supportsTools: true,
    supportsStreaming: true,
    bestFor: ['chat', 'diagnose', 'pricing', 'booking', 'general', 'reasoning', 'analysis'],
  },

  'qwen/qwen3-coder:free': {
    id: 'qwen/qwen3-coder:free',
    name: 'Qwen3 Coder 480B A35B',
    provider: 'openrouter',
    contextWindow: 1000000,
    costTier: 'free',
    speedTier: 'fast',
    qualityTier: 'premium',
    supportsTools: true,
    supportsStreaming: true,
    bestFor: ['chat', 'diagnose', 'pricing', 'booking', 'general', 'reasoning', 'analysis'],
  },

  'meta-llama/llama-3.1-8b-instruct:free': {
    id: 'meta-llama/llama-3.1-8b-instruct:free',
    name: 'Llama 3.1 8B Instruct',
    provider: 'openrouter',
    contextWindow: 128000,
    costTier: 'free',
    speedTier: 'fast',
    qualityTier: 'standard',
    supportsTools: true,
    supportsStreaming: true,
    bestFor: ['health', 'quick-response', 'fallback', 'simple-tasks'],
  },

  'gemini-2.5-flash-lite': {
    id: 'gemini-2.5-flash-lite',
    name: 'Gemini 2.5 Flash Lite',
    provider: 'gemini',
    contextWindow: 128000,
    costTier: 'free',
    speedTier: 'fast',
    qualityTier: 'standard',
    supportsTools: true,
    supportsStreaming: true,
    bestFor: ['health', 'quick-response', 'fallback', 'simple-tasks', 'vision'],
  },
};

/** Default model ID */
export const DEFAULT_MODEL_ID = 'meta-llama/llama-4-scout-17b-16e-instruct';

/** Fallback model ID when primary fails */
export const FALLBACK_MODEL_ID = 'meta-llama/llama-3.1-8b-instruct:free';

/**
 * Returns a model definition by ID.
 * Falls back to the default model if not found.
 */
export function getModelDefinition(modelId: string): ModelDefinition {
  return MODEL_REGISTRY[modelId] ?? MODEL_REGISTRY[DEFAULT_MODEL_ID];
}

/**
 * Returns all models matching a specific use case.
 */
export function getModelsForUseCase(useCase: string): ModelDefinition[] {
  return Object.values(MODEL_REGISTRY).filter((m) =>
    m.bestFor.includes(useCase)
  );
}
