import { MemoryCache } from './memory-cache';
import { Counters } from '../metrics';
import { Logger } from '../logger';

export class ResponseCache {
  static async getOrSet<T>(
    key: string,
    ttlSeconds: number,
    fetcher: () => Promise<T>
  ): Promise<T> {
    const cached = MemoryCache.get<T>(key);
    
    if (cached !== null) {
      Counters.trackCacheHit();
      Logger.debug(`Cache HIT for key: ${key}`);
      return cached;
    }

    Counters.trackCacheMiss();
    Logger.debug(`Cache MISS for key: ${key}`);

    const freshData = await fetcher();
    
    // Only cache if the data is truthy (don't cache null/undefined errors)
    if (freshData) {
      MemoryCache.set(key, freshData, ttlSeconds);
    }

    return freshData;
  }
}
