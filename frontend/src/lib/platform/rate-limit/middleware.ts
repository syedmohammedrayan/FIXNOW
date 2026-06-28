import { AppError } from '../errors';
import { RateLimitRule } from './rules';
import { Logger } from '../logger';

interface RateLimitRecord {
  count: number;
  resetAt: number; // timestamp in ms
}

export class RateLimiter {
  private static store = new Map<string, RateLimitRecord>();

  /**
   * Checks if a request is allowed. Throws AppError (429) if exceeded.
   */
  static checkLimit(userId: string, rule: RateLimitRule, actionName: string = 'api_request'): void {
    const key = `${userId}:${actionName}`;
    const now = Date.now();
    const record = this.store.get(key);

    if (!record || now > record.resetAt) {
      // First request or window expired
      this.store.set(key, {
        count: 1,
        resetAt: now + (rule.windowSeconds * 1000)
      });
      return;
    }

    if (record.count >= rule.maxRequests) {
      Logger.warn(`Rate limit exceeded for user ${userId} on ${actionName}`);
      throw new AppError(
        'Too many requests. Please try again later.',
        'RATE_LIMIT_EXCEEDED',
        429,
        true
      );
    }

    // Increment count
    record.count++;
  }

  /**
   * Clears expired records from memory to prevent memory leaks.
   * Can be called periodically or via a cron job.
   */
  static cleanup(): void {
    const now = Date.now();
    for (const [key, record] of this.store.entries()) {
      if (now > record.resetAt) {
        this.store.delete(key);
      }
    }
  }
}
