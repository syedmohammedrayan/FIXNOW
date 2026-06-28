import { MetricsCollector } from './collector';

export class Timers {
  /**
   * Records the latency for an AI model provider call.
   */
  static recordAILatency(provider: string, durationMs: number) {
    MetricsCollector.recordDistribution(`ai.${provider}.latency_ms`, durationMs);
  }

  /**
   * Records the overall orchestration pipeline latency.
   */
  static recordWorkflowLatency(workflowId: string, durationMs: number) {
    MetricsCollector.recordDistribution(`workflow.${workflowId}.latency_ms`, durationMs);
  }

  /**
   * Utility to wrap a Promise and automatically record its latency.
   */
  static async withTimer<T>(metricName: string, fn: () => Promise<T>): Promise<T> {
    const start = Date.now();
    try {
      return await fn();
    } finally {
      const durationMs = Date.now() - start;
      MetricsCollector.recordDistribution(metricName, durationMs);
    }
  }
}
