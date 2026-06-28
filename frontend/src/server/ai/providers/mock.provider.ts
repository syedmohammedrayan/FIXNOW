import { AIProvider } from './provider.interface';
import { AIRequest } from '../interfaces/request';
import { AIResponse } from '../interfaces/response';
import { ProviderHealth, ProviderOptions } from './provider.types';
import { ProviderConfig } from './provider.config';

export class MockProvider implements AIProvider {
  name = 'mock';

  async generate(request: AIRequest, options?: ProviderOptions): Promise<AIResponse> {
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

  async stream(request: AIRequest, options?: ProviderOptions): Promise<any> {
    // In a real stream, this would return an async iterable or ReadableStream
    // For mock, returning a simple structure simulating a stream
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
