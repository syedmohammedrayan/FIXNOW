import { createHash } from 'crypto';

export class CacheKeys {
  /**
   * Generates a cache key for Smart Diagnosis based on the problem text.
   */
  static diagnosisKey(problem: string, applianceInfo?: string): string {
    const raw = `${problem}_${applianceInfo || 'none'}`;
    const hash = createHash('sha256').update(raw).digest('hex');
    return `diagnosis_${hash}`;
  }

  /**
   * Generates a cache key for Predictive Maintenance risk analysis.
   */
  static maintenanceRiskKey(applianceId: string): string {
    return `maintenance_risk_${applianceId}`;
  }

  /**
   * Generates a cache key for AI Admin Summaries.
   */
  static adminSummaryKey(dateStr: string): string {
    return `admin_summary_${dateStr}`;
  }
}
