/**
 * Core Runtime Engine Types
 */

export interface RuntimeMetrics {
  requestId: string;
  provider: string;
  model: string;
  startTime: number;
  endTime: number;
  latency: number;
  success: boolean;
  retryCount: number;
  error?: string;
}

export interface RuntimeExecutionConfig {
  maxRetries?: number;
  timeoutMs?: number;
  priority?: 'speed' | 'quality' | 'balanced';
  intent?: 'chat' | 'diagnose' | 'pricing' | 'booking' | 'general';
}
