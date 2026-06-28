/**
 * FixNow AI Workflow 3 — Parts Predictor
 *
 * Predicts required, optional, and consumable parts for a repair job.
 */

import { FixNowAIService } from '@/lib/ai/service/fixnow-ai.service';
import { DiagnosisResult } from '@/features/diagnosis';
import { BookingPlan } from '@/features/booking-ai';
import { PartsPrediction } from './types';
import { PARTS_PREDICTION_PROMPT, buildPartsUserPrompt } from './prompts';
import { validatePartsPrediction } from './validator';

export class PartsPredictor {
  private aiService: FixNowAIService;

  constructor(aiService: FixNowAIService) {
    this.aiService = aiService;
  }

  /**
   * Predicts the spare parts breakdown for the given repair scenario.
   */
  async predictParts(diagnosis: DiagnosisResult, bookingPlan: BookingPlan): Promise<PartsPrediction> {
    const userPrompt = buildPartsUserPrompt(
      JSON.stringify(diagnosis, null, 2),
      JSON.stringify(bookingPlan, null, 2)
    );

    const raw = await this.aiService.analyze<any>(
      [
        { role: 'system', content: PARTS_PREDICTION_PROMPT },
        { role: 'user', content: userPrompt }
      ],
      'technician',
      'anonymous'
    );

    if (!raw) {
      throw new Error('PartsPredictor: AI returned null.');
    }

    const validation = validatePartsPrediction(raw);

    if (!validation.valid || !validation.result) {
      console.warn('PartsPrediction validation failed:', validation.errors);
      return { required: bookingPlan.requiredParts || [], optional: [], consumables: [] };
    }

    return validation.result;
  }
}
