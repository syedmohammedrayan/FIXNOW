import { AIRequest } from '../interfaces/request';
import { AIResponse } from '../interfaces/response';
import { ProviderHealth, ProviderOptions } from './provider.types';

/**
 * Universal Provider Interface
 * Every LLM vendor must implement these methods. No exceptions.
 */
export interface AIProvider {
  /** The unique string identifier for this provider (e.g., 'openrouter') */
  name: string;

  /** Generate a complete text response */
  generate(request: AIRequest, options?: ProviderOptions): Promise<AIResponse>;

  /** Stream a text response back to the client */
  stream(request: AIRequest, options?: ProviderOptions): Promise<ReadableStream | any>;

  /** Get the health status of this provider connection */
  health(): Promise<ProviderHealth>;

  /** List all models currently available or installed on this provider */
  listModels(): Promise<string[]>;
}
