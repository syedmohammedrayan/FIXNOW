/**
 * FixNow AI Workflow 6 — SLA Risk Analyzer
 *
 * Estimates which jobs or customers may miss their SLA.
 */

import { FixNowAIService } from '@/lib/ai/service/fixnow-ai.service';
import { SLAComplianceInsight } from './types';
import { SLA_RISK_PROMPT } from './prompts';
import { validateSLACompliance } from './validator';

export class SLARiskEngine {
  private aiService: FixNowAIService;

  constructor(aiService: FixNowAIService) {
    this.aiService = aiService;
  }

  /**
   * Analyzes active jobs to predict SLA compliance risk.
   */
  async analyze(jobData: string, userId?: string): Promise<SLAComplianceInsight> {
    const raw = await this.aiService.analyze<any>(
      [
        { role: 'system', content: SLA_RISK_PROMPT },
        { role: 'user', content: `Job Data:\n${jobData}` }
      ],
      'technician',
      userId || 'admin'
    );

    if (!raw) throw new Error('SLARiskEngine: AI returned null.');

    const validation = validateSLACompliance(raw);
    if (!validation.valid || !validation.result) {
      console.warn('SLACompliance validation failed:', validation.errors);
      return {
        jobId: 'unknown', customerId: 'unknown',
        status: 'At Risk', missRiskScore: 0.5, estimatedDelayHours: 0,
        riskFactors: ['Insufficient data.'], interventions: ['Review manually.']
      };
    }

    return validation.result;
  }
}
