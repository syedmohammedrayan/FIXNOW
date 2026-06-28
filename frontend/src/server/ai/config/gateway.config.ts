/**
 * Gateway Configuration
 * Contains Timeout, Retry, Logging, Streaming, Max Tokens, Temperature, Top P.
 * Nothing hardcoded elsewhere.
 */
export class GatewayConfig {
  public readonly timeoutMs: number = 30000;
  public readonly maxRetries: number = 3;
  public readonly enableLogging: boolean = true;
  public readonly enableStreaming: boolean = true;
  public readonly maxTokens: number = 4096;
  public readonly temperature: number = 0.4;
  public readonly topP: number = 0.9;
  
  private static instance: GatewayConfig;

  private constructor() {}

  public static getInstance(): GatewayConfig {
    if (!GatewayConfig.instance) {
      GatewayConfig.instance = new GatewayConfig();
    }
    return GatewayConfig.instance;
  }
}
