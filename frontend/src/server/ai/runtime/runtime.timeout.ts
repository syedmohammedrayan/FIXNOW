import { TimeoutError } from '../gateway/gateway.errors';

/**
 * Timeout Policy
 * Wraps provider execution to enforce strict SLA guarantees.
 */
export class TimeoutPolicy {
  
  /**
   * Executes a promise with a timeout.
   */
  static async execute<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
    let timer: NodeJS.Timeout;
    
    const timeoutPromise = new Promise<T>((_, reject) => {
      timer = setTimeout(() => {
        reject(new TimeoutError(`Runtime execution timed out after ${timeoutMs}ms`));
      }, timeoutMs);
    });

    try {
      return await Promise.race([promise, timeoutPromise]);
    } finally {
      clearTimeout(timer!);
    }
  }
}
