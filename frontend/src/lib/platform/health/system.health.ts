import { GroqHealth } from './groq.health';
import { FirebaseHealth } from './firebase.health';
import { CascadeHealth } from './cascade.health';
import { HindsightHealth } from './hindsight.health';

export interface SystemHealthStatus {
  groq: 'healthy' | 'unhealthy' | 'degraded';
  firebase: 'healthy' | 'unhealthy' | 'degraded';
  cascadeflow: 'healthy' | 'unhealthy' | 'degraded';
  hindsight: 'healthy' | 'unhealthy' | 'degraded';
  uptime: number;
}

export class SystemHealth {
  private static startTime = Date.now();

  static async getStatus(): Promise<SystemHealthStatus> {
    const [groq, firebase, cascadeflow, hindsight] = await Promise.all([
      GroqHealth.check(),
      FirebaseHealth.check(),
      CascadeHealth.check(),
      HindsightHealth.check()
    ]);

    return {
      groq,
      firebase,
      cascadeflow,
      hindsight,
      uptime: Math.floor((Date.now() - this.startTime) / 1000)
    };
  }
}
