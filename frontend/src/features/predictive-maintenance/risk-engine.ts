/**
 * FixNow AI Workflow 4 — Risk Engine
 *
 * Analyzes appliance repair history, customer memory, and technician outcomes
 * to produce a MaintenanceRisk prediction with failure probability.
 */

import { FixNowAIService } from '@/lib/ai/service/fixnow-ai.service';
import { ApplianceProfile, RepairHistoryEntry, MaintenanceRisk } from './types';
import { RISK_ANALYSIS_PROMPT, buildRiskAnalysisPrompt } from './prompts';
import { validateMaintenanceRisk } from './validator';

export class RiskEngine {
  private aiService: FixNowAIService;

  constructor(aiService: FixNowAIService) {
    this.aiService = aiService;
  }

  /**
   * Analyzes an appliance's repair history to predict future failures.
   *
   * Example: An LG AC with 3 gas refills in 12 months → high risk,
   *          compressor failure predicted within 2-3 months.
   */
  async analyzeRisk(
    appliance: ApplianceProfile,
    repairHistory: RepairHistoryEntry[],
    userId?: string,
    memoryStr?: string
  ): Promise<MaintenanceRisk> {
    const userPrompt = buildRiskAnalysisPrompt(
      JSON.stringify(appliance, null, 2),
      JSON.stringify(repairHistory, null, 2),
      memoryStr
    );

    const raw = await this.aiService.analyze<any>(
      [
        { role: 'system', content: RISK_ANALYSIS_PROMPT },
        { role: 'user', content: userPrompt }
      ],
      'technician',
      userId || 'anonymous'
    );

    if (!raw) {
      throw new Error('RiskEngine: AI returned null.');
    }

    const validation = validateMaintenanceRisk(raw);

    if (!validation.valid || !validation.result) {
      console.warn('MaintenanceRisk validation failed:', validation.errors);

      // Conservative fallback — assume moderate risk if AI fails
      return {
        riskScore: 0.3,
        healthStatus: 'Moderate',
        predictedIssue: 'Unable to determine — manual inspection recommended',
        estimatedFailureWindow: 'Unknown',
        confidence: 0.1
      };
    }

    return validation.result;
  }
}
