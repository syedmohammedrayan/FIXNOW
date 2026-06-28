/**
 * AI Configuration
 * =================
 * Central configuration for the entire AI subsystem.
 * All timeouts, retries, defaults, and feature flags live here.
 * Never hardcode these values in business code.
 */

import { getAIEnv } from './env.validation';

export interface AIConfig {
  /** Default model to use when no specific model is requested */
  defaultModel: string;
  /** Request timeout in milliseconds */
  timeout: number;
  /** Maximum number of retry attempts */
  maxRetries: number;
  /** Environment mode */
  environment: string;
  /** Log level */
  logLevel: string;
  /** Whether memory (Hindsight) is enabled */
  memoryEnabled: boolean;
  /** Whether CascadeFlow runtime routing is enabled */
  cascadeEnabled: boolean;
}

/**
 * Builds the AI configuration from validated environment variables.
 * This is the single source of truth for all AI settings.
 */
export function createAIConfig(): AIConfig {
  const env = getAIEnv();

  return {
    defaultModel: env.DEFAULT_MODEL,
    timeout: env.AI_TIMEOUT,
    maxRetries: env.AI_MAX_RETRIES,
    environment: env.CASCADEFLOW_ENV,
    logLevel: env.LOG_LEVEL,
    memoryEnabled: Boolean(env.HINDSIGHT_API_KEY),
    cascadeEnabled: true,
  };
}

/** Cached config singleton */
let _config: AIConfig | null = null;

/**
 * Returns the AI configuration singleton.
 * Lazily initializes on first access.
 */
export function getAIConfig(): AIConfig {
  if (!_config) {
    _config = createAIConfig();
  }
  return _config;
}
