/**
 * Provider-specific types for the AI provider abstraction layer.
 * Shared by all providers that implement the AIProvider interface.
 */

// Describes the current connection status of a provider, used for health dashboards and fallback decisions.
export interface ProviderHealth {
  status: 'connected' | 'disconnected' | 'degraded';
  latencyMs: number;
  availableModels: string[];
  providerVersion: string;
}

// Per-request overrides that callers can pass to fine-tune the model's generation behaviour.
// Optional fields let providers use sensible defaults when the caller doesn't specify.
export interface ProviderOptions {
  model?: string;        // Which model to use (e.g. 'llama3-8b-8192')
  temperature?: number;  // Randomness — lower = more deterministic
  topP?: number;         // Nucleus sampling — works together with temperature
  maxTokens?: number;    // Hard cap on response length
  stream?: boolean;      // Whether to stream the response token-by-token
}
