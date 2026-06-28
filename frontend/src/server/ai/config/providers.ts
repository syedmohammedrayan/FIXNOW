/**
 * Provider Registry
 * ==================
 * Maps provider names to their configuration.
 * The runtime layer uses this to instantiate the correct AI SDK provider.
 *
 * Currently only Groq is configured (free tier).
 * Additional providers can be added here without touching other code.
 */

export interface ProviderConfig {
  /** Provider identifier */
  id: string;
  /** Human-readable name */
  name: string;
  /** Whether this provider is currently active */
  enabled: boolean;
  /** Priority for fallback ordering (lower = higher priority) */
  priority: number;
  /** Environment variable name for the API key */
  apiKeyEnvVar: string;
  /** Base URL override (if needed) */
  baseUrl?: string;
}

/**
 * Registry of all configured AI providers.
 * Order matters — providers are tried by priority during fallback.
 */
export const PROVIDER_REGISTRY: Record<string, ProviderConfig> = {
  groq: {
    id: 'groq',
    name: 'Groq',
    enabled: true,
    priority: 1,
    apiKeyEnvVar: 'GROQ_API_KEY',
  },
} as const;

/**
 * Returns all enabled providers sorted by priority.
 */
export function getEnabledProviders(): ProviderConfig[] {
  return Object.values(PROVIDER_REGISTRY)
    .filter((p) => p.enabled)
    .sort((a, b) => a.priority - b.priority);
}

/**
 * Returns a specific provider config by ID.
 */
export function getProviderConfig(providerId: string): ProviderConfig | undefined {
  return PROVIDER_REGISTRY[providerId];
}
