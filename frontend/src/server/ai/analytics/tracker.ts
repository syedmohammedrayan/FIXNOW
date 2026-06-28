/**
 * AI Analytics Tracker
 * =====================
 * Tracks AI usage metrics for monitoring, billing, and optimization.
 * Stores aggregated statistics in memory for Sprint 2.
 * In production, this would write to a time-series database.
 *
 * Metrics tracked:
 *   - Total requests, success/failure rates
 *   - Token consumption by model
 *   - Average latency by intent
 *   - Memory hit rates
 *   - Cost estimates
 */

/**
 * Per-model usage statistics.
 */
interface ModelUsageStats {
  requestCount: number;
  totalTokens: number;
  totalLatencyMs: number;
  errors: number;
}

/**
 * Global analytics state.
 */
interface AnalyticsState {
  /** Total requests processed since server start */
  totalRequests: number;
  /** Total successful requests */
  successfulRequests: number;
  /** Total failed requests */
  failedRequests: number;
  /** Per-model statistics */
  modelUsage: Record<string, ModelUsageStats>;
  /** Total tokens consumed */
  totalTokens: number;
  /** Total memory recalls attempted */
  memoryRecalls: number;
  /** Total memory items stored */
  memoryStores: number;
  /** Server start time */
  startedAt: number;
}

/** Global analytics state */
const analytics: AnalyticsState = {
  totalRequests: 0,
  successfulRequests: 0,
  failedRequests: 0,
  modelUsage: {},
  totalTokens: 0,
  memoryRecalls: 0,
  memoryStores: 0,
  startedAt: Date.now(),
};

/**
 * Track a completed AI request.
 */
export function trackRequest(params: {
  model: string;
  tokens: number;
  latencyMs: number;
  success: boolean;
  memoryRecalled: number;
  memoryStored: boolean;
}): void {
  analytics.totalRequests++;

  if (params.success) {
    analytics.successfulRequests++;
  } else {
    analytics.failedRequests++;
  }

  analytics.totalTokens += params.tokens;
  analytics.memoryRecalls += params.memoryRecalled;
  if (params.memoryStored) analytics.memoryStores++;

  // Per-model tracking
  if (!analytics.modelUsage[params.model]) {
    analytics.modelUsage[params.model] = {
      requestCount: 0,
      totalTokens: 0,
      totalLatencyMs: 0,
      errors: 0,
    };
  }

  const modelStats = analytics.modelUsage[params.model];
  modelStats.requestCount++;
  modelStats.totalTokens += params.tokens;
  modelStats.totalLatencyMs += params.latencyMs;
  if (!params.success) modelStats.errors++;
}

/**
 * Get current analytics snapshot.
 * Used by admin dashboards and health checks.
 */
export function getAnalyticsSnapshot(): {
  uptime: number;
  totalRequests: number;
  successRate: number;
  totalTokens: number;
  avgLatencyMs: number;
  memoryRecalls: number;
  memoryStores: number;
  modelBreakdown: Record<string, { requests: number; avgLatency: number }>;
} {
  const uptimeMs = Date.now() - analytics.startedAt;

  const modelBreakdown: Record<string, { requests: number; avgLatency: number }> = {};
  for (const [model, stats] of Object.entries(analytics.modelUsage)) {
    modelBreakdown[model] = {
      requests: stats.requestCount,
      avgLatency:
        stats.requestCount > 0
          ? Math.round(stats.totalLatencyMs / stats.requestCount)
          : 0,
    };
  }

  return {
    uptime: Math.round(uptimeMs / 1000),
    totalRequests: analytics.totalRequests,
    successRate:
      analytics.totalRequests > 0
        ? analytics.successfulRequests / analytics.totalRequests
        : 0,
    totalTokens: analytics.totalTokens,
    avgLatencyMs:
      analytics.totalRequests > 0
        ? Math.round(
            Object.values(analytics.modelUsage).reduce(
              (sum, s) => sum + s.totalLatencyMs,
              0
            ) / analytics.totalRequests
          )
        : 0,
    memoryRecalls: analytics.memoryRecalls,
    memoryStores: analytics.memoryStores,
    modelBreakdown,
  };
}
