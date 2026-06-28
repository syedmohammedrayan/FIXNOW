import { MetricsCollector } from './collector';

export interface DashboardMetrics {
  counters: Record<string, number>;
  averages: Record<string, number>;
  rates: {
    cacheHitRate: number;
    memoryHitRate: number;
    errorRate: number;
  };
}

export class MetricsDashboard {
  static getMetricsSnapshot(): DashboardMetrics {
    const counters = MetricsCollector.getCounters();
    const distributions = MetricsCollector.getDistributions();
    const averages: Record<string, number> = {};

    for (const [key, values] of Object.entries(distributions)) {
      if (values.length === 0) {
        averages[key] = 0;
      } else {
        const sum = values.reduce((a, b) => a + b, 0);
        averages[key] = Math.round(sum / values.length);
      }
    }

    const totalRequests = counters['ai.requests.total'] || 0;
    
    // Cache Hit Rate
    const cacheHits = counters['platform.cache.hits'] || 0;
    const cacheMisses = counters['platform.cache.misses'] || 0;
    const totalCacheOps = cacheHits + cacheMisses;
    const cacheHitRate = totalCacheOps > 0 ? cacheHits / totalCacheOps : 0;

    // Memory Hit Rate
    const memoryHits = counters['ai.memory.hits'] || 0;
    const memoryMisses = counters['ai.memory.misses'] || 0;
    const totalMemoryOps = memoryHits + memoryMisses;
    const memoryHitRate = totalMemoryOps > 0 ? memoryHits / totalMemoryOps : 0;

    // Error Rate
    let totalErrors = 0;
    for (const [key, count] of Object.entries(counters)) {
      if (key.startsWith('errors.')) totalErrors += count;
    }
    const errorRate = totalRequests > 0 ? totalErrors / totalRequests : 0;

    return {
      counters,
      averages,
      rates: {
        cacheHitRate,
        memoryHitRate,
        errorRate
      }
    };
  }
}
