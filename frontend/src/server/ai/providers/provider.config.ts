/**
 * Provider Configuration
 * Pulls default settings from environment variables.
 */
export class ProviderConfig {
  public readonly defaultProvider: string = process.env.AI_PROVIDER || 'openrouter';
  public readonly fallbackProvider: string = process.env.FALLBACK_PROVIDER || 'groq';
  public readonly defaultModel: string = process.env.DEFAULT_MODEL || 'qwen/qwen3-coder:free';
  
  public readonly timeoutMs: number = 30000;
  public readonly maxRetries: number = 3;
  public readonly temperature: number = 0.4;
  public readonly topP: number = 0.9;
  public readonly enableStreaming: boolean = true;
  
  private static instance: ProviderConfig;

  private constructor() {}

  public static getInstance(): ProviderConfig {
    if (!ProviderConfig.instance) {
      ProviderConfig.instance = new ProviderConfig();
    }
    return ProviderConfig.instance;
  }
}
