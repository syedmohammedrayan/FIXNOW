/**
 * FixNow AI Workflow 7 — Orchestration Validator
 *
 * Validates orchestration outputs and step execution order.
 * Rejects incomplete or malformed orchestration results.
 */

import {
  OrchestrationResult,
  OrchestrationContext,
  WorkflowStep,
  OrchestrationRequest
} from './types';

export interface OrchestrationValidationResult {
  valid: boolean;
  errors: string[];
}

export class OrchestrationValidator {
  /**
   * Validates an OrchestrationRequest before execution.
   */
  validateRequest(request: OrchestrationRequest): OrchestrationValidationResult {
    const errors: string[] = [];

    if (!request.trigger) errors.push("Missing 'trigger'.");
    if (!request.userId) errors.push("Missing 'userId'.");
    if (!request.sessionId) errors.push("Missing 'sessionId'.");

    // At least one input must be present
    const hasInput = request.problemText || request.imageDescription || request.ocrText || request.audioDescription || request.jobId;
    if (!hasInput) {
      errors.push('At least one input (problemText, imageDescription, ocrText, audioDescription, or jobId) must be provided.');
    }

    return { valid: errors.length === 0, errors };
  }

  /**
   * Validates that required steps in the pipeline completed successfully.
   */
  validateStepCompletion(steps: WorkflowStep[], requiredWorkflows: string[]): OrchestrationValidationResult {
    const errors: string[] = [];
    const completedWorkflows = steps
      .filter(s => s.status === 'completed')
      .map(s => s.workflowId);

    for (const required of requiredWorkflows) {
      if (!completedWorkflows.includes(required as any)) {
        errors.push(`Required workflow '${required}' did not complete successfully.`);
      }
    }

    return { valid: errors.length === 0, errors };
  }

  /**
   * Validates the final orchestration result.
   */
  validateResult(result: OrchestrationResult): OrchestrationValidationResult {
    const errors: string[] = [];

    if (!result.status) errors.push("Missing 'status'.");
    if (!result.trigger) errors.push("Missing 'trigger'.");
    if (!Array.isArray(result.steps)) errors.push("'steps' must be an array.");
    if (typeof result.totalDurationMs !== 'number') errors.push("Missing 'totalDurationMs'.");
    if (!result.completedAt) errors.push("Missing 'completedAt'.");

    // Check for failed non-optional steps
    const failedSteps = result.steps.filter(s => s.status === 'failed');
    if (failedSteps.length > 0) {
      errors.push(`${failedSteps.length} step(s) failed: ${failedSteps.map(s => s.name).join(', ')}.`);
    }

    return { valid: errors.length === 0, errors };
  }

  /**
   * Validates that steps executed in the correct dependency order.
   */
  validateExecutionOrder(steps: WorkflowStep[], expectedOrder: string[]): OrchestrationValidationResult {
    const errors: string[] = [];
    const executedOrder = steps
      .filter(s => s.status === 'completed')
      .map(s => s.workflowId);

    let lastIndex = -1;
    for (const workflowId of executedOrder) {
      const expectedIndex = expectedOrder.indexOf(workflowId);
      if (expectedIndex === -1) continue; // Not in expected order, skip
      if (expectedIndex < lastIndex) {
        errors.push(`Workflow '${workflowId}' executed out of order.`);
      }
      lastIndex = expectedIndex;
    }

    return { valid: errors.length === 0, errors };
  }
}
