import { AIProvider } from './provider.interface';
import { AIRequest } from '../interfaces/request';
import { AIResponse } from '../interfaces/response';
import { ProviderHealth, ProviderOptions } from './provider.types';

export class OllamaProvider implements AIProvider {
  name = 'ollama';

  async generate(request: AIRequest, options?: ProviderOptions): Promise<AIResponse> {
    // Skeleton implementation
    return {
      requestId: request.requestId,
      success: true,
      content: 'Ollama Skeleton Response',
      provider: this.name,
      model: options?.model || 'llama3',
      latency: 200,
      usage: { promptTokens: 10, completionTokens: 10, totalTokens: 20 },
      metadata: { local: true }
    };
  }

  async stream(request: AIRequest, options?: ProviderOptions): Promise<any> {
    return { status: 'streaming-not-implemented' };
  }

  async health(): Promise<ProviderHealth> {
    return {
      status: 'connected',
      latencyMs: 5,
      availableModels: ['llama3', 'mistral'],
      providerVersion: 'v11434'
    };
  }

  async listModels(): Promise<string[]> {
    return ['llama3', 'mistral'];
  }
}
