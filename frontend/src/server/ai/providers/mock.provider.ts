import { AIProvider } from './provider.interface';
import { AIRequest } from '../interfaces/request';
import { AIResponse } from '../interfaces/response';
import { ProviderHealth, ProviderOptions } from './provider.types';
import { ProviderConfig } from './provider.config';

/**
 * MockProvider — offline fallback and test double for the AI provider layer.
 * When no real API key is configured, the ProviderFactory falls back here so
 * the app continues to function without making live LLM calls.
 */
export class MockProvider implements AIProvider {
  name = 'mock';

  // Returns a deterministic static response — useful for tests and demos without API keys.
    const config = ProviderConfig.getInstance();
    
    return {
      requestId: request.requestId,
      success: true,
      content: 'Hello from Mock Provider',
      provider: this.name,
      model: options?.model || config.defaultModel,
      latency: 50,
      usage: { promptTokens: 0, completionTokens: 5, totalTokens: 5 },
      metadata: { offline: true }
    };
  }

  // Mock streaming simulates a stream object so callers don't need to branch on provider type.
    return {
      id: request.requestId,
      simulateStream: 'Hello from Mock Provider'
    };
  }

  async health(): Promise<ProviderHealth> {
    return {
      status: 'connected',
      latencyMs: 1,
      availableModels: ['mock-model-v1', 'mock-model-v2'],
      providerVersion: '1.0.0-mock'
    };
  }

  async listModels(): Promise<string[]> {
    return ['mock-model-v1', 'mock-model-v2'];
  }
}
