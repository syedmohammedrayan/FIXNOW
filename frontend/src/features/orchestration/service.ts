/**
 * FixNow AI Workflow 7 — Orchestration Service
 *
 * The public API for the entire FixNow AI platform.
 * This is the single entry point that coordinates all 6 AI workflows.
 *
 * It calls existing workflow services only.
 * No direct Groq, Hindsight, or CascadeFlow imports.
 */

import { WorkflowRegistry } from './registry';
import { OrchestrationCoordinator } from './coordinator';
import { OrchestrationValidator } from './validator';
import { OrchestrationRequest, OrchestrationResult } from './types';
import { DiagnosisResult } from '@/features/diagnosis/types';
import { BookingPlan } from '@/features/booking-ai/types';
import { TechnicianWorkPlan, RepairOutcome } from '@/features/technician-copilot/types';

export class OrchestrationService {
  private registry: WorkflowRegistry;
  private coordinator: OrchestrationCoordinator;
  private validator: OrchestrationValidator;

  constructor() {
    this.registry = new WorkflowRegistry();
    this.coordinator = new OrchestrationCoordinator(this.registry);
    this.validator = new OrchestrationValidator();
  }

  /**
   * Processes a customer request end-to-end.
   * Multimodal Context → Classification → Diagnosis → Booking
   */
  async processCustomerRequest(request: OrchestrationRequest): Promise<OrchestrationResult> {
    const validation = this.validator.validateRequest(request);
    if (!validation.valid) {
      return {
        status: 'failed',
        trigger: request.trigger,
        steps: [],
        outputs: {},
        totalDurationMs: 0,
        completedAt: new Date().toISOString(),
        warnings: validation.errors
      };
    }

    return this.coordinator.handleCustomerIssue(request);
  }

  /**
   * Processes a technician assignment.
   * Generates work plan, parts prediction, checklist, and safety guide.
   */
  async processTechnicianUpdate(
    request: OrchestrationRequest,
    diagnosis: DiagnosisResult,
    bookingPlan: BookingPlan
  ): Promise<OrchestrationResult> {
    return this.coordinator.handleTechnicianAssignment(request, diagnosis, bookingPlan);
  }

  /**
   * Processes repair completion.
   * Generates summary, retains memory, triggers predictive maintenance updates.
   */
  async processRepairCompletion(
    request: OrchestrationRequest,
    workPlan: TechnicianWorkPlan,
    outcome: RepairOutcome,
    technicianNotes?: string
  ): Promise<OrchestrationResult> {
    return this.coordinator.handleRepairCompletion(request, workPlan, outcome, technicianNotes);
  }

  /**
   * Processes an admin review request.
   * Generates operational summaries, technician insights, customer risk, etc.
   */
  async processAdminRequest(request: OrchestrationRequest, platformData: string): Promise<OrchestrationResult> {
    return this.coordinator.handleAdminReview(request, platformData);
  }

  /**
   * Runs daily/periodic orchestration.
   * Generates operations summary, model usage analysis, and fault detection.
   */
  async runDailyOrchestration(platformData: string, traceData: string): Promise<OrchestrationResult> {
    return this.coordinator.runPeriodicInsights(platformData, traceData);
  }

  /**
   * Returns the workflow registry for inspection.
   */
  getRegistry(): WorkflowRegistry {
    return this.registry;
  }
}

// Export a singleton instance for ease of use
export const orchestrationService = new OrchestrationService();
