import { AIProvider } from './provider.interface';
import { AIRequest } from '../interfaces/request';
import { AIResponse } from '../interfaces/response';
import { ProviderHealth, ProviderOptions } from './provider.types';

/**
 * GroqProvider — adapter for Groq's ultra-fast LLM inference API.
 * Groq serves open-source models (LLaMA, Mixtral) at very low latency, making it
 * a good fallback when the primary provider is slow or rate-limited.
 * This is currently a skeleton; actual Groq calls run in the backend (routes/ai.js).
 */
export class GroqProvider implements AIProvider {
  name = 'groq';

  // Skeleton implementation — returns a static response rather than calling the Groq API.
  async generate(request: AIRequest, options?: ProviderOptions): Promise<AIResponse> {
    return {
      requestId: request.requestId,
      success: true,
      content: 'Groq Skeleton Response',
      provider: this.name,
      model: options?.model || 'llama3-8b-8192',
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
      availableModels: ['llama3-8b-8192', 'mixtral-8x7b-32768'],
      providerVersion: 'v1'
    };
  }

  async listModels(): Promise<string[]> {
    return ['llama3-8b-8192', 'mixtral-8x7b-32768'];
  }
}
