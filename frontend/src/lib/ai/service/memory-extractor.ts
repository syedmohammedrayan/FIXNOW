import { AIContext } from './context-builder';

export class MemoryExtractor {
  /**
   * Extracts durable knowledge from an interaction.
   * Returns a formatted string suitable for Hindsight retain().
   */
  extractForRetention(context: AIContext, aiResponseText: string): string | null {
    if (!context.request || !aiResponseText) {
      return null;
    }

    // Combine user request and AI response into a single interaction record.
    // Hindsight will automatically analyze this and extract durable facts.
    const retainContent = `User (${context.role}): ${context.request}\nAI Response: ${aiResponseText}`;
    
    // Only return if substantive
    if (retainContent.length > 30) {
      return retainContent;
    }
    
    return null;
  }
}

export const memoryExtractor = new MemoryExtractor();
