/**
 * AI Tools Registry
 * ==================
 * Defines tools (functions) that AI agents can call.
 * These are Vercel AI SDK compatible tool definitions.
 *
 * Currently empty — tools will be added in Sprint 3 when
 * specific agents (diagnosis, booking, pricing) are built.
 *
 * Tool examples that will be added:
 *   - searchTechnicians: Find nearby technicians
 *   - createBooking: Create a service booking
 *   - analyzePricing: Get pricing estimates
 *   - getServiceHistory: Retrieve past service records
 */

/**
 * Placeholder tools registry.
 * Each tool will be a Vercel AI SDK compatible tool definition
 * with a Zod schema for parameters.
 */
export const AI_TOOLS = {} as const;

/**
 * Get tools for a specific agent/intent.
 * Returns an empty object for now — agents will register their
 * tools here in Sprint 3.
 */
export function getToolsForIntent(_intent: string): Record<string, unknown> {
  return {};
}
