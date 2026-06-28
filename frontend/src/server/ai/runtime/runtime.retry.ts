import { aiLogger } from '../logs/logger';
import { TimeoutError } from '../gateway/gateway.errors';

/**
 * Retry Policy
 * Implements exponential backoff for transient failures.
 */
export class RetryPolicy {
  
  /**
   * Executes an operation with exponential backoff retries.
   * Does NOT retry on validation or auth errors.
   */
  static async execute<T>(
    operation: (attempt: number) => Promise<T>,
    maxRetries: number
  ): Promise<T> {
    let attempt = 1;

    while (true) {
      try {
        return await operation(attempt);
      } catch (error: any) {
        // Do not retry on client errors or explicit timeouts
        if (error instanceof TimeoutError || error.status === 400 || error.status === 401) {
          throw error;
        }

        if (attempt >= maxRetries) {
          aiLogger.error(`[RetryPolicy] Max retries (${maxRetries}) reached. Failing.`);
          throw error;
        }

        // Exponential backoff: 500ms, 1000ms, 2000ms...
        const backoffMs = Math.pow(2, attempt - 1) * 500;
        aiLogger.warn(`[RetryPolicy] Operation failed. Retrying in ${backoffMs}ms (Attempt ${attempt + 1}/${maxRetries}). Error: ${error.message}`);
        
        await new Promise(resolve => setTimeout(resolve, backoffMs));
        attempt++;
      }
    }
  }
}
