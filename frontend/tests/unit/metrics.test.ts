import { MetricsCollector, Counters, Timers, MetricsDashboard } from '@/lib/platform/metrics';

describe('Metrics Layer', () => {
  beforeEach(() => {
    MetricsCollector.reset();
  });

  describe('Collector', () => {
    it('should increment counters', () => {
      MetricsCollector.increment('test.count');
      MetricsCollector.increment('test.count', 2);
      const counters = MetricsCollector.getCounters();
      expect(counters['test.count']).toBe(3);
    });

    it('should record distributions', () => {
      MetricsCollector.recordDistribution('test.latency', 100);
      MetricsCollector.recordDistribution('test.latency', 200);
      const dists = MetricsCollector.getDistributions();
      expect(dists['test.latency']).toEqual([100, 200]);
    });
  });

  describe('Timers Utility', () => {
    it('should time a promise execution', async () => {
      const mockFn = jest.fn().mockImplementation(() => {
        return new Promise(resolve => setTimeout(resolve, 50));
      });

      await Timers.withTimer('async.op.latency', mockFn);
      
      const dists = MetricsCollector.getDistributions();
      expect(dists['async.op.latency'].length).toBe(1);
      // Ensure time was recorded > 0
      expect(dists['async.op.latency'][0]).toBeGreaterThanOrEqual(40);
    });
  });

  describe('Dashboard Aggregation', () => {
    it('should calculate hit rates properly', () => {
      Counters.trackCacheHit();
      Counters.trackCacheHit();
      Counters.trackCacheHit();
      Counters.trackCacheMiss();
      // 3 hits, 1 miss = 75% hit rate

      const snapshot = MetricsDashboard.getMetricsSnapshot();
      expect(snapshot.rates.cacheHitRate).toBe(0.75);
    });
  });
});
