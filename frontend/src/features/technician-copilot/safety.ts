/**
 * FixNow AI Workflow 3 — Safety Checklist Generator
 *
 * Generates appliance-specific safety warnings and protocols.
 */

import { FixNowAIService } from '@/lib/ai/service/fixnow-ai.service';
import { DiagnosisResult } from '@/features/diagnosis';
import { BookingPlan } from '@/features/booking-ai';
import { SafetyChecklist } from './types';
import { SAFETY_PROMPT, buildSafetyUserPrompt } from './prompts';
import { validateSafetyChecklist } from './validator';

export class SafetyGuideGenerator {
  private aiService: FixNowAIService;

  constructor(aiService: FixNowAIService) {
    this.aiService = aiService;
  }

  /**
   * Generates appliance-specific safety recommendations.
   */
  async generateSafetyGuide(diagnosis: DiagnosisResult, bookingPlan: BookingPlan): Promise<SafetyChecklist> {
    const userPrompt = buildSafetyUserPrompt(
      JSON.stringify(diagnosis, null, 2),
      JSON.stringify(bookingPlan, null, 2)
    );

    const raw = await this.aiService.analyze<any>(
      [
        { role: 'system', content: SAFETY_PROMPT },
        { role: 'user', content: userPrompt }
      ],
      'technician',
      'anonymous'
    );

    if (!raw) {
      throw new Error('SafetyGuideGenerator: AI returned null.');
    }

    const validation = validateSafetyChecklist(raw);

    if (!validation.valid || !validation.result) {
      console.warn('SafetyChecklist validation failed:', validation.errors);
      return { warnings: [] };
    }

    return validation.result;
  }
}
