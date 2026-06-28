/**
 * AI Logger
 * ==========
 * Structured logging for the AI subsystem using Pino.
 * All AI requests, responses, errors, and metrics flow through here.
 *
 * Logs include:
 *   - Request/response pairs
 *   - Model used, tokens consumed
 *   - Latency, retries, fallbacks
 *   - Memory hits/misses
 *   - Error details
 *
 * Uses: pino
 */

/**
 * Log entry for an AI request lifecycle.
 */
export interface AILogEntry {
  /** Unique request ID */
  requestId: string;
  /** Timestamp */
  timestamp: number;
  /** Request intent */
  intent: string;
  /** Model that was used */
  model: string;
  /** Provider (e.g., 'groq') */
  provider: string;
  /** Latency in milliseconds */
  latencyMs: number;
  /** Number of retries */
  retries: number;
  /** Whether fallback was used */
  usedFallback: boolean;
  /** Token usage */
  tokens: {
    input: number;
    output: number;
    total: number;
  };
  /** Memory stats */
  memory: {
    recalled: number;
    stored: boolean;
  };
  /** Error (if any) */
  error?: string;
  /** Success status */
  success: boolean;
}

/** In-memory log buffer for recent entries */
const _logBuffer: AILogEntry[] = [];
const MAX_BUFFER_SIZE = 1000;

/** Pino logger instance (lazy init) */
let _logger: any = null;

/**
 * Get or create the Pino logger instance.
 * Falls back to console if Pino is unavailable.
 */
async function getLogger() {
  if (_logger) return _logger;

  try {
    const pino = await import('pino').catch(() => null);
    if (pino) {
      _logger = pino.default({
        level: process.env.LOG_LEVEL || 'info',
        transport:
          process.env.NODE_ENV !== 'production'
            ? { target: 'pino/file', options: { destination: 1 } } // stdout
            : undefined,
      });
    } else {
      // Fallback to console-based logger
      _logger = {
        info: console.log,
        warn: console.warn,
        error: console.error,
        debug: console.debug,
      };
    }
  } catch {
    _logger = {
      info: console.log,
      warn: console.warn,
      error: console.error,
      debug: console.debug,
    };
  }

  return _logger;
}

/**
 * Log a complete AI request lifecycle.
 */
export async function logAIRequest(entry: AILogEntry): Promise<void> {
  const logger = await getLogger();

  // Add to buffer
  _logBuffer.push(entry);
  if (_logBuffer.length > MAX_BUFFER_SIZE) {
    _logBuffer.shift();
  }

  // Log via Pino
  if (entry.success) {
    logger.info(
      {
        requestId: entry.requestId,
        intent: entry.intent,
        model: entry.model,
        latencyMs: entry.latencyMs,
        tokens: entry.tokens.total,
        retries: entry.retries,
        memoryRecalled: entry.memory.recalled,
      },
      `[AI] ${entry.intent} completed in ${entry.latencyMs}ms using ${entry.model}`
    );
  } else {
    logger.error(
      {
        requestId: entry.requestId,
        intent: entry.intent,
        model: entry.model,
        error: entry.error,
        retries: entry.retries,
      },
      `[AI] ${entry.intent} FAILED: ${entry.error}`
    );
  }
}

/**
 * Get recent log entries (for diagnostics/admin panel).
 */
export function getRecentLogs(count: number = 50): AILogEntry[] {
  return _logBuffer.slice(-count);
}

/**
 * Get aggregate stats from recent logs.
 */
export function getLogStats(): {
  totalRequests: number;
  successRate: number;
  avgLatencyMs: number;
  totalTokens: number;
} {
  if (_logBuffer.length === 0) {
    return { totalRequests: 0, successRate: 0, avgLatencyMs: 0, totalTokens: 0 };
  }

  const total = _logBuffer.length;
  const successful = _logBuffer.filter((e) => e.success).length;
  const avgLatency =
    _logBuffer.reduce((sum, e) => sum + e.latencyMs, 0) / total;
  const totalTokens = _logBuffer.reduce((sum, e) => sum + e.tokens.total, 0);

  return {
    totalRequests: total,
    successRate: successful / total,
    avgLatencyMs: Math.round(avgLatency),
    totalTokens,
  };
}
