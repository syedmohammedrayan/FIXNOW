/**
 * FixNow AI Workflow 2 — Booking Planner
 */

import { FixNowAIService } from '@/lib/ai/service/fixnow-ai.service';
import { DiagnosisResult } from '@/features/diagnosis';
import { BookingPlan } from './types';
import { BOOKING_PLANNER_SYSTEM_PROMPT, getBookingPlannerPrompt } from './prompts';
import { validateBookingPlan } from './validator';

export class BookingPlanner {
  private aiService: FixNowAIService;

  constructor(aiService: FixNowAIService) {
    this.aiService = aiService;
  }

  /**
   * Translates a DiagnosisResult directly into a complete BookingPlan via AI reasoning.
   */
  async createBookingPlan(
    diagnosis: DiagnosisResult, 
    userId?: string, 
    historyStr?: string,
    mapsContext?: { distanceText: string; durationText: string }
  ): Promise<BookingPlan> {
    const systemPrompt = BOOKING_PLANNER_SYSTEM_PROMPT;
    const prompt = getBookingPlannerPrompt(JSON.stringify(diagnosis, null, 2), historyStr, mapsContext);

    // We pass the system prompt into the AI service natively
    const analysisCall = await this.aiService.analyze<any>(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt }
      ],
      'customer',
      userId || 'anonymous'
    );

    if (!analysisCall) {
      throw new Error("Failed to generate booking plan. AI returned null.");
    }

    const validation = validateBookingPlan(analysisCall);

    if (!validation.valid || !validation.result) {
      // Fallback or retry logic (similar to Workflow 1). 
      // For now, we return a safe default or throw.
      console.warn('BookingPlan Validation Failed:', validation.errors);
      
      return {
        problem: diagnosis.problem,
        technicianCategory: diagnosis.recommendedTechnicianType,
        urgency: diagnosis.urgency,
        estimatedCost: { min: 500, max: 1500 },
        estimatedDurationMinutes: 60,
        requiredParts: [],
        requiredSkills: [],
        recommendedAppointmentWindow: 'Within 24 hours',
        customerNotes: 'Automated fallback plan due to AI validation failure.',
        confidence: 0.1
      };
    }

    return validation.result;
  }
}
