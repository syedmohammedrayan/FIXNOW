/**
 * FixNow AI Workflow 3 — Technician Copilot Validator
 *
 * Validates every AI response before it is returned to consumers.
 */

import {
  TechnicianWorkPlan,
  PartsPrediction,
  RepairChecklist,
  SafetyChecklist,
  RepairSummary,
  CopilotValidationResult
} from './types';

// ─── Work Plan Validator ──────────────────────────────────────

export function validateWorkPlan(data: any): CopilotValidationResult {
  const errors: string[] = [];

  if (!data || typeof data !== 'object') {
    return { valid: false, errors: ['Output is not a valid JSON object.'] };
  }

  if (typeof data.problem !== 'string' || !data.problem.trim()) {
    errors.push("Missing or invalid 'problem'.");
  }

  const validCategories = [
    'Electrical', 'Plumbing', 'HVAC', 'Carpentry',
    'Cleaning', 'Painting', 'Appliance Repair', 'General'
  ];
  if (!validCategories.includes(data.technicianType)) {
    errors.push(`Invalid 'technicianType': ${data.technicianType}`);
  }

  if (typeof data.estimatedDuration !== 'string' || !data.estimatedDuration.trim()) {
    errors.push("Missing or invalid 'estimatedDuration'.");
  }

  const validDifficulties = ['Easy', 'Medium', 'Hard', 'Expert'];
  if (!validDifficulties.includes(data.repairDifficulty)) {
    errors.push(`Invalid 'repairDifficulty': ${data.repairDifficulty}`);
  }

  // Parts validation
  if (!data.parts || typeof data.parts !== 'object') {
    errors.push("Missing 'parts' object.");
  } else {
    if (!Array.isArray(data.parts.required)) errors.push("'parts.required' must be an array.");
    if (!Array.isArray(data.parts.optional)) errors.push("'parts.optional' must be an array.");
    if (!Array.isArray(data.parts.consumables)) errors.push("'parts.consumables' must be an array.");
  }

  // Checklist validation
  if (!data.checklist || !Array.isArray(data.checklist.steps)) {
    errors.push("Missing 'checklist.steps' array.");
  } else {
    for (const step of data.checklist.steps) {
      if (typeof step.order !== 'number' || typeof step.instruction !== 'string' || typeof step.isSafetyCritical !== 'boolean') {
        errors.push(`Invalid checklist step at order ${step.order || '?'}.`);
        break;
      }
    }
  }

  // Safety validation
  if (!data.safety || !Array.isArray(data.safety.warnings)) {
    errors.push("Missing 'safety.warnings' array.");
  } else {
    for (const w of data.safety.warnings) {
      if (typeof w.category !== 'string' || typeof w.instruction !== 'string') {
        errors.push("Invalid safety warning entry.");
        break;
      }
    }
  }

  if (typeof data.customerNotes !== 'string') {
    errors.push("Missing 'customerNotes'.");
  }

  if (typeof data.confidence !== 'number' || data.confidence < 0 || data.confidence > 1) {
    errors.push("'confidence' must be a number between 0 and 1.");
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  return { valid: true, result: data as TechnicianWorkPlan };
}

// ─── Parts Prediction Validator ───────────────────────────────

export function validatePartsPrediction(data: any): { valid: boolean; result?: PartsPrediction; errors?: string[] } {
  const errors: string[] = [];

  if (!data || typeof data !== 'object') {
    return { valid: false, errors: ['Output is not a valid JSON object.'] };
  }
  if (!Array.isArray(data.required)) errors.push("'required' must be an array.");
  if (!Array.isArray(data.optional)) errors.push("'optional' must be an array.");
  if (!Array.isArray(data.consumables)) errors.push("'consumables' must be an array.");

  if (errors.length > 0) return { valid: false, errors };
  return { valid: true, result: data as PartsPrediction };
}

// ─── Repair Checklist Validator ───────────────────────────────

export function validateRepairChecklist(data: any): { valid: boolean; result?: RepairChecklist; errors?: string[] } {
  if (!data || !Array.isArray(data.steps)) {
    return { valid: false, errors: ["'steps' must be an array."] };
  }
  for (const step of data.steps) {
    if (typeof step.order !== 'number' || typeof step.instruction !== 'string' || typeof step.isSafetyCritical !== 'boolean') {
      return { valid: false, errors: [`Invalid checklist step at order ${step.order || '?'}.`] };
    }
  }
  return { valid: true, result: data as RepairChecklist };
}

// ─── Safety Checklist Validator ───────────────────────────────

export function validateSafetyChecklist(data: any): { valid: boolean; result?: SafetyChecklist; errors?: string[] } {
  if (!data || !Array.isArray(data.warnings)) {
    return { valid: false, errors: ["'warnings' must be an array."] };
  }
  for (const w of data.warnings) {
    if (typeof w.category !== 'string' || typeof w.instruction !== 'string' || typeof w.severity !== 'string') {
      return { valid: false, errors: ['Invalid safety warning entry.'] };
    }
  }
  return { valid: true, result: data as SafetyChecklist };
}

// ─── Repair Summary Validator ─────────────────────────────────

export function validateRepairSummary(data: any): { valid: boolean; result?: RepairSummary; errors?: string[] } {
  const errors: string[] = [];

  if (!data || typeof data !== 'object') {
    return { valid: false, errors: ['Output is not a valid JSON object.'] };
  }
  if (typeof data.problem !== 'string') errors.push("Missing 'problem'.");
  if (!Array.isArray(data.actionsTaken)) errors.push("'actionsTaken' must be an array.");
  if (!Array.isArray(data.partsUsed)) errors.push("'partsUsed' must be an array.");
  if (!['resolved', 'partial', 'escalated', 'rescheduled'].includes(data.outcome)) {
    errors.push(`Invalid 'outcome': ${data.outcome}`);
  }
  if (typeof data.actualDurationMinutes !== 'number') errors.push("'actualDurationMinutes' must be a number.");

  if (errors.length > 0) return { valid: false, errors };
  return { valid: true, result: data as RepairSummary };
}
