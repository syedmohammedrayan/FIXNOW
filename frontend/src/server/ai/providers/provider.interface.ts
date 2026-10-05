import { AIRequest } from '../interfaces/request';
import { AIResponse } from '../interfaces/response';
import { ProviderHealth, ProviderOptions } from './provider.types';

/**
 * Universal AIProvider Interface — the contract every LLM vendor adapter must satisfy.
 * Using an interface (not a base class) enforces a strict API shape via TypeScript's
 * structural typing, so swapping providers requires only updating the implementation.
 */
export interface AIProvider {
  /** The unique string identifier for this provider (e.g., 'openrouter', 'groq'). */
  name: string;

  /**
   * Generate a complete text response in one shot.
   * Returns a Promise so callers can await the full result before using it.
   */
  generate(request: AIRequest, options?: ProviderOptions): Promise<AIResponse>;

  /**
   * Stream a text response token-by-token for a more responsive UI.
   * Returns a ReadableStream (or vendor-specific stream) that the route handler pipes to the client.
   */
  stream(request: AIRequest, options?: ProviderOptions): Promise<ReadableStream | any>;

  /**
   * Returns the health status of this provider's connection.
   * Used by monitoring dashboards and to decide whether to fall back to an alternative provider.
   */
  health(): Promise<ProviderHealth>;

  /** Lists all models currently available or installed on this provider. */
  listModels(): Promise<string[]>;
}
