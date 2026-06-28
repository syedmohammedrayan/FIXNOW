import { MetricsCollector } from './collector';

export class Counters {
  static trackAIRequest() {
    MetricsCollector.increment('ai.requests.total');
  }

  static trackWorkflowUsage(workflowId: string) {
    MetricsCollector.increment(`workflow.${workflowId}.invocations`);
  }

  static trackMemoryHit() {
    MetricsCollector.increment('ai.memory.hits');
  }

  static trackMemoryMiss() {
    MetricsCollector.increment('ai.memory.misses');
  }

  static trackMemoryStore() {
    MetricsCollector.increment('ai.memory.stores');
  }

  static trackCacheHit() {
    MetricsCollector.increment('platform.cache.hits');
  }

  static trackCacheMiss() {
    MetricsCollector.increment('platform.cache.misses');
  }

  static trackError(errorType: string) {
    MetricsCollector.increment(`errors.${errorType}`);
  }
}
