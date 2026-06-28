/**
 * Rate Limits & Budget Constraints
 * ==================================
 * Defines operational limits for the AI subsystem.
 * These protect against runaway costs, abuse, and resource exhaustion.
 *
 * CascadeFlow uses these limits for budget gating and compliance.
 */

export interface RateLimitConfig {
  /** Maximum requests per minute per user */
  requestsPerMinute: number;
  /** Maximum requests per hour per user */
  requestsPerHour: number;
  /** Maximum concurrent requests globally */
  maxConcurrent: number;
}

export interface TokenLimitConfig {
  /** Maximum input tokens per request */
  maxInputTokens: number;
  /** Maximum output tokens per request */
  maxOutputTokens: number;
  /** Maximum total tokens per request */
  maxTotalTokens: number;
}

export interface BudgetConfig {
  /** Daily token budget across all users */
  dailyTokenBudget: number;
  /** Per-request token budget */
  perRequestBudget: number;
  /** Whether to enforce budget limits */
  enforceBudget: boolean;
}

/**
 * Default rate limits.
 * These are generous for development. Tighten for production.
 */
export const RATE_LIMITS: RateLimitConfig = {
  requestsPerMinute: 30,
  requestsPerHour: 500,
  maxConcurrent: 10,
};

/**
 * Default token limits per request.
 */
export const TOKEN_LIMITS: TokenLimitConfig = {
  maxInputTokens: 8000,
  maxOutputTokens: 4096,
  maxTotalTokens: 12000,
};

/**
 * Default budget constraints.
 * Using Groq free tier, so budgets are generous.
 */
export const BUDGET_LIMITS: BudgetConfig = {
  dailyTokenBudget: 1_000_000,
  perRequestBudget: 12000,
  enforceBudget: false, // Disabled until we need production budget control
};

/**
 * Timeout constants (milliseconds).
 */
export const TIMEOUTS = {
  /** Default AI request timeout */
  AI_REQUEST: 30_000,
  /** Memory recall timeout */
  MEMORY_RECALL: 5_000,
  /** Memory store timeout */
  MEMORY_STORE: 5_000,
  /** Health check timeout */
  HEALTH_CHECK: 3_000,
} as const;
