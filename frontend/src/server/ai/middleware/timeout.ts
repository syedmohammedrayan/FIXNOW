import { TimeoutError } from '../gateway/gateway.errors';
import { GatewayConfig } from '../config/gateway.config';

export function withTimeout<T>(promise: Promise<T>, timeoutMs?: number): Promise<T> {
  const ms = timeoutMs || GatewayConfig.getInstance().timeoutMs;
  
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => 
      setTimeout(() => reject(new TimeoutError(`Request timed out after ${ms}ms`)), ms)
    )
  ]);
}
