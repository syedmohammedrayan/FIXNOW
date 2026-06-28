/**
 * Environment Variable Validation
 * ================================
 * Validates all required environment variables at application startup.
 * Uses `envalid` to provide clear, actionable error messages if any
 * required variable is missing or malformed.
 *
 * This runs server-side only. Client-side env vars (NEXT_PUBLIC_*)
 * are validated separately since they're inlined at build time.
 */

import { cleanEnv, str, num, url } from 'envalid';

/**
 * Server-side AI environment variables.
 * Call this once during server initialization (e.g., in gateway or API route).
 */
export function validateAIEnv() {
  return cleanEnv(process.env, {
    // --- Providers ---
    GROQ_API_KEY: str({
      desc: 'Groq API key for LLM access',
      example: 'gsk_...',
      default: '', // Make optional since we are switching to OpenRouter
    }),
    OPENROUTER_API_KEY: str({
      desc: 'OpenRouter API key for LLM access',
      example: 'sk-or-v1-...',
      default: '',
    }),
    GEMINI_API_KEY: str({
      desc: 'Gemini API key for LLM access',
      example: 'AIzaSy...',
      default: '',
    }),

    // --- Hindsight Memory Layer ---
    HINDSIGHT_API_KEY: str({
      desc: 'Hindsight API key for persistent memory',
      example: 'hs_...',
      default: '',
    }),
    HINDSIGHT_URL: str({
      desc: 'Hindsight server URL',
      default: 'http://localhost:8765',
    }),

    // --- CascadeFlow Runtime ---
    CASCADEFLOW_ENV: str({
      desc: 'CascadeFlow environment mode',
      choices: ['development', 'staging', 'production'] as const,
      default: 'development',
    }),

    // --- AI Defaults ---
    DEFAULT_MODEL: str({
      desc: 'Default LLM model identifier',
      default: 'llama-3.3-70b-versatile',
    }),
    AI_TIMEOUT: num({
      desc: 'AI request timeout in milliseconds',
      default: 30000,
    }),
    AI_MAX_RETRIES: num({
      desc: 'Maximum retry attempts for AI requests',
      default: 3,
    }),

    // --- Logging ---
    LOG_LEVEL: str({
      desc: 'Log level for AI subsystem',
      choices: ['fatal', 'error', 'warn', 'info', 'debug', 'trace'] as const,
      default: 'info',
    }),
  });
}

/** Cached validated env — lazily initialized */
let _cachedEnv: ReturnType<typeof validateAIEnv> | null = null;

/**
 * Returns validated environment variables.
 * Caches result after first call for performance.
 */
export function getAIEnv() {
  if (!_cachedEnv) {
    _cachedEnv = validateAIEnv();
  }
  return _cachedEnv;
}
