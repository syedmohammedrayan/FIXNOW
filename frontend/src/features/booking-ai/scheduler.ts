/**
 * FixNow AI Workflow 2 — Scheduler
 */

import { FixNowAIService } from '@/lib/ai/service/fixnow-ai.service';
import { DiagnosisResult } from '@/features/diagnosis';
import { ScheduleRecommendation } from './types';

export class BookingScheduler {
  private aiService: FixNowAIService;

  constructor(aiService: FixNowAIService) {
    this.aiService = aiService;
  }

  /**
   * Suggests the best scheduling window based on diagnosis and inferred context.
   */
  async recommendSchedule(
    diagnosis: DiagnosisResult, 
    userId?: string, 
    mapsContext?: { distanceText: string; durationText: string }
  ): Promise<ScheduleRecommendation> {
    const prompt = `
      You are an expert dispatcher for Indian home services.
      Based on the following diagnosis and travel logistics, recommend a scheduling window and priority.
      
      DIAGNOSIS:
      Problem: ${diagnosis.problem}
      Urgency: ${diagnosis.urgency}
      Emergency: ${diagnosis.needsEmergencyVisit ? 'Yes' : 'No'}
      
      TRAVEL LOGISTICS (Google Maps):
      Distance: ${mapsContext?.distanceText || 'Unknown'}
      Estimated Travel Time: ${mapsContext?.durationText || 'Unknown'}
      
      Output ONLY valid JSON matching this schema:
      {
        "preferredWindow": "e.g., Within 2 hours, Today Evening, Tomorrow Morning",
        "travelTimeConsideration": "Reasoning based on the provided Google Maps travel time.",
        "priority": "P0 | P1 | P2 | P3"
      }
    `;

    const result = await this.aiService.analyze<ScheduleRecommendation>(
      [{ role: 'user', content: prompt }],
      'customer',
      userId || 'anonymous'
    );

    if (!result) {
      throw new Error("Failed to generate schedule recommendation. AI returned null.");
    }

    return result;
  }
}
