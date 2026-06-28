import { AIProvider } from './provider.interface';
import { AIRequest } from '../interfaces/request';
import { AIResponse } from '../interfaces/response';
import { ProviderHealth, ProviderOptions } from './provider.types';

export class GeminiProvider implements AIProvider {
  name = 'gemini';

  async generate(request: AIRequest, options?: ProviderOptions): Promise<AIResponse> {
    return {
      requestId: request.requestId,
      success: true,
      content: 'Gemini Skeleton Response',
      provider: this.name,
      model: options?.model || 'gemini-2.5-flash-lite',
      latency: 45,
      usage: { promptTokens: 10, completionTokens: 10, totalTokens: 20 },
      metadata: {}
    };
  }

  async stream(request: AIRequest, options?: ProviderOptions): Promise<any> {
    return { status: 'streaming-not-implemented' };
  }

  async health(): Promise<ProviderHealth> {
    return {
      status: 'connected',
      latencyMs: 40,
      availableModels: ['gemini-2.5-flash-lite'],
      providerVersion: 'v1'
    };
  }

  async listModels(): Promise<string[]> {
    return ['gemini-2.5-flash-lite'];
  }
}
