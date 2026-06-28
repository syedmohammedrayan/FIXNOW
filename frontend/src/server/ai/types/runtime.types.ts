/**
 * Runtime Types
 * ==============
 * Type definitions for the AI runtime layer.
 * Covers model selection, routing decisions, and execution context.
 */

/**
 * Context passed to the runtime for model execution.
 */
export interface RuntimeContext {
  /** Which model to use */
  modelId: string;
  /** System prompt to prepend */
  systemPrompt?: string;
  /** The user's message */
  userMessage: string;
  /** Conversation history in Vercel AI SDK format */
  messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>;
  /** Maximum tokens for the response */
  maxTokens?: number;
  /** Temperature (0-2) for response creativity */
  temperature?: number;
  /** Request timeout override */
  timeoutMs?: number;
}

/**
 * Result returned by the runtime after model execution.
 */
export interface RuntimeResult {
  /** Generated text content */
  text: string;
  /** Model that was actually used (may differ if fallback occurred) */
  modelUsed: string;
  /** Provider that served the request */
  provider: string;
  /** Token usage statistics */
  usage: TokenUsage;
  /** Latency in milliseconds */
  latencyMs: number;
  /** Number of retries needed */
  retries: number;
  /** Whether a fallback model was used */
  usedFallback: boolean;
}

/**
 * Token usage tracking.
 */
export interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

/**
 * CascadeFlow routing decision.
 */
export interface RoutingDecision {
  /** Selected model ID */
  modelId: string;
  /** Why this model was selected */
  reason: string;
  /** Estimated cost tier */
  costTier: string;
  /** Estimated latency tier */
  latencyTier: string;
  /** Confidence in this routing decision (0-1) */
  confidence: number;
}

/**
 * Runtime health status.
 */
export interface RuntimeHealth {
  /** Whether the primary provider is reachable */
  providerConnected: boolean;
  /** Whether CascadeFlow is initialized */
  cascadeInitialized: boolean;
  /** Provider name */
  provider: string;
  /** Last error (if any) */
  lastError?: string;
}
