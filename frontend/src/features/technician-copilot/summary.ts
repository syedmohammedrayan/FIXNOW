/**
 * FixNow AI Workflow 3 — Repair Summary Generator
 *
 * Generates structured post-repair summaries for Hindsight retention.
 * This output becomes the primary input for Workflow 4 (Predictive Maintenance).
 */

import { FixNowAIService } from '@/lib/ai/service/fixnow-ai.service';
import { TechnicianWorkPlan, RepairSummary, RepairOutcome } from './types';
import { REPAIR_SUMMARY_PROMPT, buildRepairSummaryUserPrompt } from './prompts';
import { validateRepairSummary } from './validator';

export class RepairSummaryGenerator {
  private aiService: FixNowAIService;

  constructor(aiService: FixNowAIService) {
    this.aiService = aiService;
  }

  /**
   * Generates a structured post-repair summary from the work plan and outcome.
   * This summary is retained in Hindsight for future AI recall.
   */
  async generateRepairSummary(
    workPlan: TechnicianWorkPlan,
    outcome: RepairOutcome,
    technicianNotes?: string
  ): Promise<RepairSummary> {
    const userPrompt = buildRepairSummaryUserPrompt(
      JSON.stringify(workPlan, null, 2),
      outcome,
      technicianNotes
    );

    const raw = await this.aiService.analyze<any>(
      [
        { role: 'system', content: REPAIR_SUMMARY_PROMPT },
        { role: 'user', content: userPrompt }
      ],
      'technician',
      'anonymous'
    );

    if (!raw) {
      throw new Error('RepairSummaryGenerator: AI returned null.');
    }

    const validation = validateRepairSummary(raw);

    if (!validation.valid || !validation.result) {
      console.warn('RepairSummary validation failed:', validation.errors);
      return {
        problem: workPlan.problem,
        actionsTaken: [],
        partsUsed: [],
        outcome,
        actualDurationMinutes: 0,
        followUpRecommendations: '',
        technicianNotes: technicianNotes || ''
      };
    }

    return validation.result;
  }
}
