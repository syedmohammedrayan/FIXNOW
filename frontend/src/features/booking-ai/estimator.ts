/**
 * FixNow AI Workflow 2 — Estimator
 */

import { FixNowAIService } from '@/lib/ai/service/fixnow-ai.service';
import { DiagnosisResult } from '@/features/diagnosis';
import { RepairEstimate } from './types';

export class BookingEstimator {
  private aiService: FixNowAIService;

  constructor(aiService: FixNowAIService) {
    this.aiService = aiService;
  }

  /**
   * Generates a realistic cost, duration, and parts estimate based on the diagnosis.
   */
  async estimateRepair(diagnosis: DiagnosisResult, userId?: string): Promise<RepairEstimate> {
    const prompt = `
      You are an expert estimator for Indian home services.
      Based on the following diagnosis, provide a realistic repair estimate.
      
      DIAGNOSIS:
      Problem: ${diagnosis.problem}
      Technician: ${diagnosis.recommendedTechnicianType}
      Urgency: ${diagnosis.urgency}
      Estimated Action: ${diagnosis.estimatedRepair}
      
      Output ONLY valid JSON matching this schema:
      {
        "estimatedCost": { "min": number, "max": number }, // in INR
        "durationMinutes": number, // Realistic onsite time
        "requiredParts": ["exact part names"],
        "warrantyConsiderations": "Short note on warranty for these parts"
      }
    `;

    const result = await this.aiService.analyze<RepairEstimate>(
      [{ role: 'user', content: prompt }],
      'customer',
      userId || 'anonymous'
    );

    if (!result) {
      throw new Error("Failed to generate repair estimate. AI returned null.");
    }

    return result;
  }
}
