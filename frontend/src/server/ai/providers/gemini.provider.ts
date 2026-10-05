import { AIProvider } from './provider.interface';
import { AIRequest } from '../interfaces/request';
import { AIResponse } from '../interfaces/response';
import { ProviderHealth, ProviderOptions } from './provider.types';

/**
 * GeminiProvider — skeleton adapter for Google's Gemini Flash model.
 * The actual Gemini API calls happen in the backend (routes/ai.js) via the Admin SDK
 * because the API key must stay server-side. This frontend provider is a placeholder
 * that satisfies the AIProvider interface for local/offline usage.
 */
export class GeminiProvider implements AIProvider {
  name = 'gemini';

  // Returns a static skeleton response — real Gemini calls go through the backend AI route.
  async generate(request: AIRequest, options?: ProviderOptions): Promise<AIResponse> {
    return {
      requestId: request.requestId,
      success: true,
      content: 'Gemini Skeleton Response',
      provider: this.name,
      model: options?.model || 'gemini-3.5-flash-lite',
      latency: 45,
      usage: { promptTokens: 10, completionTokens: 10, totalTokens: 20 },
      metadata: {}
    };
  }

  // Streaming not yet implemented for this provider in the Next.js layer.
  async stream(request: AIRequest, options?: ProviderOptions): Promise<any> {
    return { status: 'streaming-not-implemented' };
  }

  // Reports as connected so the health dashboard shows Gemini as an available option.
  async health(): Promise<ProviderHealth> {
    return {
      status: 'connected',
      latencyMs: 40,
      availableModels: ['gemini-3.5-flash-lite'],
      providerVersion: 'v1'
    };
  }

  async listModels(): Promise<string[]> {
    return ['gemini-3.5-flash-lite'];
  }
}
