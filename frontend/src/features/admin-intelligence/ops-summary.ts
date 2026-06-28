/**
 * FixNow AI Workflow 6 — Operations Summary Engine
 *
 * Generates daily/weekly platform operation summaries.
 */

import { FixNowAIService } from '@/lib/ai/service/fixnow-ai.service';
import { OperationsSummary } from './types';
import { OPS_SUMMARY_PROMPT } from './prompts';
import { validateOperationsSummary } from './validator';

export class OpsSummaryEngine {
  private aiService: FixNowAIService;

  constructor(aiService: FixNowAIService) {
    this.aiService = aiService;
  }

  /**
   * Generates a structured operations summary from raw platform data.
   */
  async generateSummary(platformData: string, userId?: string): Promise<OperationsSummary> {
    const raw = await this.aiService.analyze<any>(
      [
        { role: 'system', content: OPS_SUMMARY_PROMPT },
        { role: 'user', content: `Platform Activity Data:\n${platformData}` }
      ],
      'technician',
      userId || 'admin'
    );

    if (!raw) throw new Error('OpsSummaryEngine: AI returned null.');

    const validation = validateOperationsSummary(raw);
    if (!validation.valid || !validation.result) {
      console.warn('OperationsSummary validation failed:', validation.errors);
      return {
        period: 'Unknown',
        totalJobs: 0, completedJobs: 0, failedJobs: 0, unresolvedJobs: 0, urgentCases: 0,
        topCategories: [], topFailureTypes: [], topTechnicians: []
      };
    }

    return validation.result;
  }
}
