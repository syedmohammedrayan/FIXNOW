import { MemoryCache, CacheManager, ResponseCache } from '@/lib/platform/cache';

describe('Cache Layer', () => {
  beforeEach(() => {
    CacheManager.flushAll();
  });

  describe('MemoryCache', () => {
    it('should set and retrieve a value', () => {
      MemoryCache.set('test-key', { data: 'test' }, 60);
      const result = MemoryCache.get<{ data: string }>('test-key');
      expect(result).toEqual({ data: 'test' });
    });

    it('should return null for expired keys', () => {
      // Set TTL to -1 seconds so it expires instantly
      MemoryCache.set('expired-key', 'value', -1);
      const result = MemoryCache.get('expired-key');
      expect(result).toBeNull();
    });

    it('should flush all keys', () => {
      MemoryCache.set('key1', 'val1', 60);
      MemoryCache.set('key2', 'val2', 60);
      CacheManager.flushAll();
      expect(MemoryCache.get('key1')).toBeNull();
      expect(MemoryCache.get('key2')).toBeNull();
    });
  });

  describe('ResponseCache Wrapper', () => {
    it('should execute the fetcher on cache miss', async () => {
      const mockFetcher = jest.fn().mockResolvedValue('fresh-data');
      
      const result = await ResponseCache.getOrSet('resource-key', 60, mockFetcher);
      
      expect(result).toBe('fresh-data');
      expect(mockFetcher).toHaveBeenCalledTimes(1);
    });

    it('should return cached data on cache hit without calling fetcher', async () => {
      MemoryCache.set('resource-key', 'cached-data', 60);
      
      const mockFetcher = jest.fn().mockResolvedValue('fresh-data');
      const result = await ResponseCache.getOrSet('resource-key', 60, mockFetcher);
      
      expect(result).toBe('cached-data');
      expect(mockFetcher).not.toHaveBeenCalled();
    });
  });
});
