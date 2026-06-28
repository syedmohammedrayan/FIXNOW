/**
 * FixNow AI Workflow 2 — Booking Intelligence Service
 *
 * The public facade for the Intelligent Booking Engine.
 * Converts a DiagnosisResult into actionable Booking intelligence.
 */

import { FixNowAIService } from '@/lib/ai/service/fixnow-ai.service';
import { DiagnosisResult, TechnicianCategory } from '@/features/diagnosis';
import { BookingPlanner } from './planner';
import { BookingEstimator } from './estimator';
import { BookingScheduler } from './scheduler';
import { 
  BookingPlan, 
  RepairEstimate, 
  ScheduleRecommendation, 
  TechnicianRecommendation 
} from './types';

export class BookingIntelligenceService {
  private aiService: FixNowAIService;
  private planner: BookingPlanner;
  private estimator: BookingEstimator;
  private scheduler: BookingScheduler;

  constructor() {
    this.aiService = new FixNowAIService();
    this.planner = new BookingPlanner(this.aiService);
    this.estimator = new BookingEstimator(this.aiService);
    this.scheduler = new BookingScheduler(this.aiService);
  }

  /**
   * The primary workflow entrypoint. Generates the complete BookingPlan.
   */
  async createBookingPlan(
    diagnosis: DiagnosisResult, 
    userId?: string, 
    historyStr?: string,
    mapsContext?: { distanceText: string; durationText: string }
  ): Promise<BookingPlan> {
    return this.planner.createBookingPlan(diagnosis, userId, historyStr, mapsContext);
  }

  /**
   * Dedicated endpoint for generating just the repair cost and parts estimate.
   */
  async estimateRepair(diagnosis: DiagnosisResult, userId?: string): Promise<RepairEstimate> {
    return this.estimator.estimateRepair(diagnosis, userId);
  }

  /**
   * Dedicated endpoint for scheduling intelligence.
   */
  async recommendSchedule(
    diagnosis: DiagnosisResult, 
    userId?: string,
    mapsContext?: { distanceText: string; durationText: string }
  ): Promise<ScheduleRecommendation> {
    return this.scheduler.recommendSchedule(diagnosis, userId, mapsContext);
  }

  /**
   * Dedicated endpoint for determining the precise technician profile required.
   */
  async recommendTechnician(diagnosis: DiagnosisResult): Promise<TechnicianRecommendation> {
    // This is often statically mapped from the diagnosis, but we wrap it for potential future ML logic.
    return {
      type: diagnosis.recommendedTechnicianType,
      requiredSkills: [diagnosis.recommendedTechnicianType + ' Standard Skillset'] // Placeholder for AI inference
    };
  }
}

// Export a singleton instance for ease of use
export const bookingIntelligenceService = new BookingIntelligenceService();
