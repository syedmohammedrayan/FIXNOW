import { MemoryCache } from './memory-cache';

export class CacheManager {
  /**
   * Clears the entire cache.
   */
  static flushAll(): void {
    MemoryCache.clear();
  }

  /**
   * Invalidates a specific key.
   */
  static invalidate(key: string): void {
    MemoryCache.delete(key);
  }
}
