/**
 * FixNow AI Workflow 3 — Technician Planner
 *
 * Converts DiagnosisResult + BookingPlan + memory into a TechnicianWorkPlan.
 */

import { FixNowAIService } from '@/lib/ai/service/fixnow-ai.service';
import { DiagnosisResult } from '@/features/diagnosis';
import { BookingPlan } from '@/features/booking-ai';
import { TechnicianWorkPlan } from './types';
import { WORK_PLAN_SYSTEM_PROMPT, buildWorkPlanUserPrompt } from './prompts';
import { validateWorkPlan } from './validator';

export class TechnicianPlanner {
  private aiService: FixNowAIService;

  constructor(aiService: FixNowAIService) {
    this.aiService = aiService;
  }

  /**
   * Generates a complete TechnicianWorkPlan from upstream workflow outputs.
   */
  async createWorkPlan(
    diagnosis: DiagnosisResult,
    bookingPlan: BookingPlan,
    userId?: string,
    memoryStr?: string
  ): Promise<TechnicianWorkPlan> {
    const userPrompt = buildWorkPlanUserPrompt(
      JSON.stringify(diagnosis, null, 2),
      JSON.stringify(bookingPlan, null, 2),
      memoryStr
    );

    const raw = await this.aiService.analyze<any>(
      [
        { role: 'system', content: WORK_PLAN_SYSTEM_PROMPT },
        { role: 'user', content: userPrompt }
      ],
      'technician',
      userId || 'anonymous'
    );

    if (!raw) {
      throw new Error('TechnicianPlanner: AI returned null.');
    }

    const validation = validateWorkPlan(raw);

    if (!validation.valid || !validation.result) {
      console.warn('TechnicianWorkPlan validation failed:', validation.errors);

      // Safe fallback
      return {
        problem: diagnosis.problem,
        technicianType: diagnosis.recommendedTechnicianType,
        estimatedDuration: diagnosis.estimatedTime || '1 hour',
        repairDifficulty: 'Medium',
        parts: { required: [], optional: [], consumables: [] },
        checklist: { steps: [] },
        safety: { warnings: [] },
        customerNotes: 'AI validation failed. Manual assessment required.',
        confidence: 0.1
      };
    }

    return validation.result;
  }
}
