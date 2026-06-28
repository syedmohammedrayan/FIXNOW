import { FeatureFlag, DEFAULT_FLAGS } from './flags';
import { Logger } from '../logger';

export class FeatureFlagProvider {
  private static overrides = new Map<FeatureFlag, boolean>();

  /**
   * Evaluates whether a feature flag is enabled.
   */
  static isEnabled(flag: FeatureFlag): boolean {
    if (this.overrides.has(flag)) {
      return this.overrides.get(flag)!;
    }
    
    // In a full implementation, you could check process.env or an external service here
    const envVarName = `NEXT_PUBLIC_FF_${flag}`;
    if (typeof process !== 'undefined' && process.env[envVarName] !== undefined) {
      return process.env[envVarName] === 'true';
    }

    return DEFAULT_FLAGS[flag];
  }

  /**
   * Dynamically overrides a feature flag at runtime.
   */
  static overrideFlag(flag: FeatureFlag, value: boolean): void {
    Logger.info(`Feature flag [${flag}] manually overridden to: ${value}`);
    this.overrides.set(flag, value);
  }

  /**
   * Resets all runtime overrides.
   */
  static resetOverrides(): void {
    Logger.info('All feature flag overrides reset');
    this.overrides.clear();
  }
}
