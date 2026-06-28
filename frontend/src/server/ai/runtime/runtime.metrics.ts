import { RuntimeMetrics } from './runtime.types';
import { aiLogger } from '../logs/logger';

/**
 * Runtime Metrics Collector
 * Captures granular execution data for future Admin Dashboard.
 */
export class MetricsCollector {
  /**
   * Records a completed execution's metrics
   */
  static record(metrics: RuntimeMetrics): void {
    // Log to central logger, allowing ingestion by Datadog/ELK/Admin
    aiLogger.info({
      event: 'RUNTIME_EXECUTION_METRICS',
      ...metrics
    });
  }
}
