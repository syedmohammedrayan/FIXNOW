/**
 * AI Prompts — System Prompts Registry
 * ======================================
 * Centralized system prompts for all AI agents.
 * Each agent (Sprint 3+) will have its own prompt here.
 * 
 * Currently contains only the base system prompt.
 * Agent-specific prompts (diagnosis, booking, pricing, copilot)
 * will be added in Sprint 3.
 */

/**
 * Base system prompt used when no agent-specific prompt is provided.
 */
export const BASE_SYSTEM_PROMPT = `You are FixNow AI, a helpful assistant for a home services platform.

Your role:
- Help customers describe and diagnose home repair issues
- Assist with finding the right technician
- Provide general guidance on home maintenance
- Be professional, concise, and helpful

Important:
- Never provide medical or legal advice
- Always recommend professional help for complex issues
- Be transparent about your limitations
- Respond in the same language the user writes in`;

/**
 * Get the system prompt for a specific intent.
 * Returns the base prompt if no intent-specific prompt exists.
 */
export function getSystemPrompt(intent: string): string {
  // Agent-specific prompts will be added in Sprint 3
  // For now, return the base prompt for all intents
  return BASE_SYSTEM_PROMPT;
}
