/**
 * Logger Middleware
 * ==================
 * Provides a pre-configured Pino logger for the AI middleware chain.
 * Handles request/response logging at the API route level.
 */

/**
 * Create a simple request logger entry.
 * Used by API routes to log incoming requests.
 */
export function logRequest(
  method: string,
  path: string,
  requestId: string,
  body?: Record<string, unknown>
): void {
  console.log(
    `[API] ${method} ${path} | reqId=${requestId} | intent=${body?.intent ?? 'unknown'}`
  );
}

/**
 * Create a simple response logger entry.
 */
export function logResponse(
  requestId: string,
  status: number,
  latencyMs: number
): void {
  const level = status >= 400 ? 'ERROR' : 'OK';
  console.log(
    `[API] Response | reqId=${requestId} | status=${status} | ${latencyMs}ms | ${level}`
  );
}
