/**
 * Provider Configuration — singleton that centralises all AI provider settings.
 * Uses the Singleton pattern so config is read once and shared across all providers.
 * Pulls default settings from environment variables so values can be changed without a code deploy.
 */
export class ProviderConfig {
  // Primary LLM vendor — can be swapped via env var without changing code.
  public readonly defaultProvider: string = process.env.AI_PROVIDER || 'openrouter';
  // Fallback vendor used when the primary provider fails or returns an error.
  public readonly fallbackProvider: string = process.env.FALLBACK_PROVIDER || 'groq';
  // Default model to use when callers don't specify a model override.
  public readonly defaultModel: string = process.env.DEFAULT_MODEL || 'qwen/qwen3-coder:free';
  
  public readonly timeoutMs: number = 30000;    // Abort request after 30 s to prevent hanging
  public readonly maxRetries: number = 3;        // Retry transient failures up to 3 times
  public readonly temperature: number = 0.4;     // Low temperature for factual, deterministic output
  public readonly topP: number = 0.9;            // Nucleus sampling complement to temperature
  public readonly enableStreaming: boolean = true;
  
  // private static instance holds the single shared instance (Singleton pattern).
  private static instance: ProviderConfig;

  private constructor() {}

  // Returns the existing instance or creates it on first call.
  public static getInstance(): ProviderConfig {
    if (!ProviderConfig.instance) {
      ProviderConfig.instance = new ProviderConfig();
    }
    return ProviderConfig.instance;
  }
}
