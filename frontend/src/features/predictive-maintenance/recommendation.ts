/**
 * FixNow AI Workflow 4 — Recommendation Generator
 *
 * Transforms technical maintenance plans into customer-friendly
 * preventive recommendations with clear language and cost estimates.
 */

import { FixNowAIService } from '@/lib/ai/service/fixnow-ai.service';
import { MaintenanceRisk, MaintenancePlan, PreventiveRecommendation } from './types';
import { RECOMMENDATION_PROMPT, buildRecommendationPrompt } from './prompts';
import { validateRecommendation } from './validator';

export class RecommendationGenerator {
  private aiService: FixNowAIService;

  constructor(aiService: FixNowAIService) {
    this.aiService = aiService;
  }

  /**
   * Generates a customer-friendly recommendation from a maintenance plan.
   */
  async generateRecommendation(
    plan: MaintenancePlan,
    risk: MaintenanceRisk
  ): Promise<PreventiveRecommendation> {
    const userPrompt = buildRecommendationPrompt(
      JSON.stringify(plan, null, 2),
      JSON.stringify(risk, null, 2)
    );

    const raw = await this.aiService.analyze<any>(
      [
        { role: 'system', content: RECOMMENDATION_PROMPT },
        { role: 'user', content: userPrompt }
      ],
      'customer',
      'anonymous'
    );

    if (!raw) {
      throw new Error('RecommendationGenerator: AI returned null.');
    }

    const validation = validateRecommendation(raw);

    if (!validation.valid || !validation.result) {
      console.warn('Recommendation validation failed:', validation.errors);
      return {
        title: 'Maintenance Recommended',
        message: 'Based on your appliance history, we recommend scheduling a preventive service visit.',
        urgency: 'routine',
        estimatedCost: { min: 500, max: 1500 }
      };
    }

    return validation.result;
  }
}
