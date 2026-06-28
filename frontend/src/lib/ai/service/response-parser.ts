/**
 * Response Parser
 * 
 * Provides utilities to parse AI string outputs into strongly typed JSON objects.
 */
export class ResponseParser {
  /**
   * Attempts to parse JSON from an AI response string.
   * Handles markdown JSON block wrapping (```json ... ```).
   */
  parseJson<T>(responseText: string): T | null {
    try {
      let cleanText = responseText.trim();
      
      // Strip markdown code blocks if present
      if (cleanText.startsWith('```')) {
        const lines = cleanText.split('\n');
        // Remove first line (e.g. ```json)
        lines.shift();
        // Remove last line (```)
        if (lines[lines.length - 1].startsWith('```')) {
          lines.pop();
        }
        cleanText = lines.join('\n').trim();
      }

      return JSON.parse(cleanText) as T;
    } catch (e) {
      console.warn('[ResponseParser] Failed to parse JSON from AI response:', e);
      return null;
    }
  }
}

export const responseParser = new ResponseParser();
