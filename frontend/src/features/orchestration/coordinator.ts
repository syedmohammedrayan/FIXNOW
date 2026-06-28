/**
 * FixNow AI Workflow 7 — Orchestration Coordinator
 *
 * The main orchestration controller that connects all 6 AI workflows.
 * This is where FixNow stops being a collection of AI features and
 * starts behaving like a single AI operating system.
 *
 * It calls existing workflow services only — no direct Groq,
 * Hindsight, or CascadeFlow imports.
 */

import { WorkflowRegistry } from './registry';
import { OrchestrationValidator } from './validator';
import {
  OrchestrationRequest,
  OrchestrationResult,
  OrchestrationContext,
  WorkflowStep,
  OrchestrationStatus
} from './types';

import { DiagnosisRequest, DiagnosisResult } from '@/features/diagnosis/types';
import { BookingPlan } from '@/features/booking-ai/types';
import { TechnicianWorkPlan, RepairOutcome, RepairSummary } from '@/features/technician-copilot/types';

export class OrchestrationCoordinator {
  private registry: WorkflowRegistry;
  private validator: OrchestrationValidator;

  constructor(registry: WorkflowRegistry) {
    this.registry = registry;
    this.validator = new OrchestrationValidator();
  }

  // ─── Step Execution Helper ────────────────────────────────────

  private async executeStep(
    name: string,
    workflowId: string,
    fn: () => Promise<any>
  ): Promise<WorkflowStep> {
    const step: WorkflowStep = {
      workflowId: workflowId as any,
      name,
      status: 'running',
      startedAt: new Date().toISOString()
    };

    const start = Date.now();
    try {
      step.output = await fn();
      step.status = 'completed';
    } catch (err: any) {
      step.status = 'failed';
      step.error = err?.message || 'Unknown error';
      console.error(`[Orchestrator] Step "${name}" failed:`, err);
    }
    step.durationMs = Date.now() - start;
    step.completedAt = new Date().toISOString();
    return step;
  }

  private buildResult(
    request: OrchestrationRequest,
    steps: WorkflowStep[],
    startTime: number
  ): OrchestrationResult {
    const hasFailures = steps.some(s => s.status === 'failed');
    const allCompleted = steps.every(s => s.status === 'completed' || s.status === 'skipped');

    let status: OrchestrationStatus = 'success';
    if (hasFailures && !allCompleted) status = 'partial';
    if (steps.every(s => s.status === 'failed')) status = 'failed';

    const outputs: Record<string, any> = {};
    for (const step of steps) {
      if (step.status === 'completed' && step.output) {
        outputs[step.workflowId] = step.output;
      }
    }

    const warnings: string[] = [];
    for (const step of steps) {
      if (step.status === 'failed') {
        warnings.push(`Step "${step.name}" failed: ${step.error}`);
      }
    }

    return {
      status,
      trigger: request.trigger,
      steps,
      outputs,
      totalDurationMs: Date.now() - startTime,
      completedAt: new Date().toISOString(),
      warnings
    };
  }

  // ─── Customer Issue Flow ──────────────────────────────────────

  async handleCustomerIssue(request: OrchestrationRequest): Promise<OrchestrationResult> {
    const startTime = Date.now();
    const steps: WorkflowStep[] = [];

    // Validate request
    const reqValidation = this.validator.validateRequest(request);
    if (!reqValidation.valid) {
      return {
        status: 'failed',
        trigger: request.trigger,
        steps: [],
        outputs: {},
        totalDurationMs: 0,
        completedAt: new Date().toISOString(),
        warnings: reqValidation.errors
      };
    }

    // Step 1: Build Multimodal Context (if voice/image/document input exists)
    if (request.imageDescription || request.audioDescription || request.ocrText) {
      const multimodalStep = await this.executeStep(
        'Build Multimodal Context',
        'multimodal',
        async () => {
          if (request.imageDescription && request.ocrText && request.layoutDescription) {
            // Use the intelligent classification pipeline
            return this.registry.multimodal.orchestrateUpload(
              request.imageDescription,
              request.ocrText,
              request.layoutDescription,
              request.userId
            );
          }
          if (request.audioDescription) {
            return this.registry.multimodal.processVoice(request.audioDescription, request.userId);
          }
          if (request.imageDescription) {
            return this.registry.multimodal.processImage(request.imageDescription, request.userId);
          }
          return null;
        }
      );
      steps.push(multimodalStep);

      // If classification routed to warranty, stop here (don't diagnose)
      if (multimodalStep.output?.status === 'warranty_workflow') {
        return this.buildResult(request, steps, startTime);
      }
    }

    // Step 2: Smart Diagnosis
    const diagnosisRequest: DiagnosisRequest = {
      problem: request.problemText || request.imageDescription || 'Unknown issue',
      imageDescription: request.imageDescription,
      userId: request.userId,
      sessionId: request.sessionId
    };

    const diagnosisStep = await this.executeStep(
      'Smart Diagnosis',
      'diagnosis',
      () => this.registry.diagnosis.diagnoseText(diagnosisRequest)
    );
    steps.push(diagnosisStep);

    if (diagnosisStep.status !== 'completed' || !diagnosisStep.output) {
      return this.buildResult(request, steps, startTime);
    }

    const diagnosis: DiagnosisResult = diagnosisStep.output;

    // Step 3: Intelligent Booking
    const bookingStep = await this.executeStep(
      'Intelligent Booking',
      'booking',
      () => this.registry.booking.createBookingPlan(diagnosis, request.userId)
    );
    steps.push(bookingStep);

    return this.buildResult(request, steps, startTime);
  }

  // ─── Technician Assignment Flow ─────────────────────────────

  async handleTechnicianAssignment(
    request: OrchestrationRequest,
    diagnosis: DiagnosisResult,
    bookingPlan: BookingPlan
  ): Promise<OrchestrationResult> {
    const startTime = Date.now();
    const steps: WorkflowStep[] = [];

    // Step 1: Generate Work Plan
    const workPlanStep = await this.executeStep(
      'Generate Technician Work Plan',
      'technician-copilot',
      () => this.registry.technicianCopilot.createWorkPlan(diagnosis, bookingPlan, request.userId)
    );
    steps.push(workPlanStep);

    // Step 2: Predict Parts
    const partsStep = await this.executeStep(
      'Predict Required Parts',
      'technician-copilot',
      () => this.registry.technicianCopilot.predictParts(diagnosis, bookingPlan)
    );
    steps.push(partsStep);

    // Step 3: Generate Safety Guide
    const safetyStep = await this.executeStep(
      'Generate Safety Guide',
      'technician-copilot',
      () => this.registry.technicianCopilot.generateSafetyGuide(diagnosis, bookingPlan)
    );
    steps.push(safetyStep);

    return this.buildResult(request, steps, startTime);
  }

  // ─── Repair Completion Flow ─────────────────────────────────

  async handleRepairCompletion(
    request: OrchestrationRequest,
    workPlan: TechnicianWorkPlan,
    outcome: RepairOutcome,
    technicianNotes?: string
  ): Promise<OrchestrationResult> {
    const startTime = Date.now();
    const steps: WorkflowStep[] = [];

    // Step 1: Generate Repair Summary (feeds into Hindsight retention via the copilot)
    const summaryStep = await this.executeStep(
      'Generate Repair Summary',
      'technician-copilot',
      () => this.registry.technicianCopilot.generateRepairSummary(workPlan, outcome, technicianNotes)
    );
    steps.push(summaryStep);

    // Step 2: Trigger Admin Intelligence for post-repair insights
    const adminStep = await this.executeStep(
      'Generate Post-Repair Alert',
      'admin-intelligence',
      () => this.registry.adminIntelligence.generateAdminAlert(
        `Repair completed. Job: ${request.jobId || 'unknown'}. Outcome: ${outcome || 'unknown'}. Notes: ${technicianNotes || 'none'}.`
      )
    );
    steps.push(adminStep);

    return this.buildResult(request, steps, startTime);
  }

  // ─── Admin Review Flow ──────────────────────────────────────

  async handleAdminReview(request: OrchestrationRequest, platformData: string): Promise<OrchestrationResult> {
    const startTime = Date.now();
    const steps: WorkflowStep[] = [];

    // Step 1: Generate Operations Summary
    const opsStep = await this.executeStep(
      'Generate Operations Summary',
      'admin-intelligence',
      () => this.registry.adminIntelligence.generateOperationsSummary(platformData)
    );
    steps.push(opsStep);

    return this.buildResult(request, steps, startTime);
  }

  // ─── Periodic Insights ──────────────────────────────────────

  async runPeriodicInsights(platformData: string, traceData: string): Promise<OrchestrationResult> {
    const startTime = Date.now();
    const steps: WorkflowStep[] = [];
    const request: OrchestrationRequest = {
      trigger: 'daily_summary',
      userId: 'system',
      sessionId: 'periodic'
    };

    // Step 1: Operations Summary
    const opsStep = await this.executeStep(
      'Daily Operations Summary',
      'admin-intelligence',
      () => this.registry.adminIntelligence.generateOperationsSummary(platformData)
    );
    steps.push(opsStep);

    // Step 2: Model Usage Analysis
    const modelStep = await this.executeStep(
      'Model Usage Analysis',
      'admin-intelligence',
      () => this.registry.adminIntelligence.analyzeModelUsage(traceData)
    );
    steps.push(modelStep);

    // Step 3: Recurring Faults Detection
    const faultsStep = await this.executeStep(
      'Recurring Faults Detection',
      'admin-intelligence',
      () => this.registry.adminIntelligence.detectRecurringFaults(platformData)
    );
    steps.push(faultsStep);

    return this.buildResult(request, steps, startTime);
  }
}
