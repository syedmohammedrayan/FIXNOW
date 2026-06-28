/**
 * FixNow AI Workflow 3 — Technician Copilot Service
 *
 * The public facade for the Technician Copilot.
 * Prepares technicians before, assists during, and documents after every repair job.
 *
 * All AI access routes through FixNowAIService only.
 */

import { FixNowAIService } from '@/lib/ai/service/fixnow-ai.service';
import { DiagnosisResult } from '@/features/diagnosis';
import { BookingPlan } from '@/features/booking-ai';
import { TechnicianPlanner } from './planner';
import { PartsPredictor } from './parts-predictor';
import { RepairChecklistGenerator } from './repair-checklist';
import { SafetyGuideGenerator } from './safety';
import { RepairSummaryGenerator } from './summary';
import {
  TechnicianWorkPlan,
  PartsPrediction,
  RepairChecklist,
  SafetyChecklist,
  RepairSummary,
  RepairOutcome
} from './types';

export class TechnicianCopilotService {
  private aiService: FixNowAIService;
  private planner: TechnicianPlanner;
  private partsPredictor: PartsPredictor;
  private checklistGenerator: RepairChecklistGenerator;
  private safetyGenerator: SafetyGuideGenerator;
  private summaryGenerator: RepairSummaryGenerator;

  constructor() {
    this.aiService = new FixNowAIService();
    this.planner = new TechnicianPlanner(this.aiService);
    this.partsPredictor = new PartsPredictor(this.aiService);
    this.checklistGenerator = new RepairChecklistGenerator(this.aiService);
    this.safetyGenerator = new SafetyGuideGenerator(this.aiService);
    this.summaryGenerator = new RepairSummaryGenerator(this.aiService);
  }

  /**
   * PRIMARY WORKFLOW: Generates a comprehensive TechnicianWorkPlan.
   * This is the main entry point — it includes parts, checklist, and safety in one call.
   */
  async createWorkPlan(
    diagnosis: DiagnosisResult,
    bookingPlan: BookingPlan,
    userId?: string,
    memoryStr?: string
  ): Promise<TechnicianWorkPlan> {
    return this.planner.createWorkPlan(diagnosis, bookingPlan, userId, memoryStr);
  }

  /**
   * Standalone parts prediction (can be called independently of the full work plan).
   */
  async predictParts(diagnosis: DiagnosisResult, bookingPlan: BookingPlan): Promise<PartsPrediction> {
    return this.partsPredictor.predictParts(diagnosis, bookingPlan);
  }

  /**
   * Standalone repair checklist generation.
   */
  async generateChecklist(diagnosis: DiagnosisResult, bookingPlan: BookingPlan): Promise<RepairChecklist> {
    return this.checklistGenerator.generateChecklist(diagnosis, bookingPlan);
  }

  /**
   * Standalone safety guide generation.
   */
  async generateSafetyGuide(diagnosis: DiagnosisResult, bookingPlan: BookingPlan): Promise<SafetyChecklist> {
    return this.safetyGenerator.generateSafetyGuide(diagnosis, bookingPlan);
  }

  /**
   * POST-REPAIR: Generates a structured repair summary for Hindsight retention.
   * This feeds into Workflow 4 (Predictive Maintenance).
   */
  async generateRepairSummary(
    workPlan: TechnicianWorkPlan,
    outcome: RepairOutcome,
    technicianNotes?: string
  ): Promise<RepairSummary> {
    return this.summaryGenerator.generateRepairSummary(workPlan, outcome, technicianNotes);
  }
}

// Export a singleton instance for ease of use
export const technicianCopilotService = new TechnicianCopilotService();
