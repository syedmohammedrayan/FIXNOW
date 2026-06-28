/**
 * FixNow AI Workflow 3 — Repair Checklist Generator
 *
 * Generates step-by-step repair checklists with safety-critical flagging.
 */

import { FixNowAIService } from '@/lib/ai/service/fixnow-ai.service';
import { DiagnosisResult } from '@/features/diagnosis';
import { BookingPlan } from '@/features/booking-ai';
import { RepairChecklist } from './types';
import { REPAIR_CHECKLIST_PROMPT, buildChecklistUserPrompt } from './prompts';
import { validateRepairChecklist } from './validator';

export class RepairChecklistGenerator {
  private aiService: FixNowAIService;

  constructor(aiService: FixNowAIService) {
    this.aiService = aiService;
  }

  /**
   * Generates a structured repair checklist for the technician.
   */
  async generateChecklist(diagnosis: DiagnosisResult, bookingPlan: BookingPlan): Promise<RepairChecklist> {
    const userPrompt = buildChecklistUserPrompt(
      JSON.stringify(diagnosis, null, 2),
      JSON.stringify(bookingPlan, null, 2)
    );

    const raw = await this.aiService.analyze<any>(
      [
        { role: 'system', content: REPAIR_CHECKLIST_PROMPT },
        { role: 'user', content: userPrompt }
      ],
      'technician',
      'anonymous'
    );

    if (!raw) {
      throw new Error('RepairChecklistGenerator: AI returned null.');
    }

    const validation = validateRepairChecklist(raw);

    if (!validation.valid || !validation.result) {
      console.warn('RepairChecklist validation failed:', validation.errors);
      return { steps: [] };
    }

    return validation.result;
  }
}
