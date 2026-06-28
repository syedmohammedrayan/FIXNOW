/**
 * Provider-specific types for the AI OS
 */

export interface ProviderHealth {
  status: 'connected' | 'disconnected' | 'degraded';
  latencyMs: number;
  availableModels: string[];
  providerVersion: string;
}

export interface ProviderOptions {
  model?: string;
  temperature?: number;
  topP?: number;
  maxTokens?: number;
  stream?: boolean;
}
