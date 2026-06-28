/**
 * FixNow AI Workflow 4 — Predictive Maintenance Validator
 *
 * Validates every AI output before it is returned to consumers.
 */

import {
  MaintenanceRisk,
  MaintenancePlan,
  PreventiveRecommendation,
  NotificationPlan,
  PredictiveValidationResult
} from './types';

// ─── MaintenanceRisk Validator ────────────────────────────────

export function validateMaintenanceRisk(data: any): PredictiveValidationResult<MaintenanceRisk> {
  const errors: string[] = [];

  if (!data || typeof data !== 'object') {
    return { valid: false, errors: ['Output is not a valid JSON object.'] };
  }

  if (typeof data.riskScore !== 'number' || data.riskScore < 0 || data.riskScore > 1) {
    errors.push("'riskScore' must be a number between 0 and 1.");
  }

  const validHealth = ['Good', 'Moderate', 'At Risk', 'Critical'];
  if (!validHealth.includes(data.healthStatus)) {
    errors.push(`Invalid 'healthStatus': ${data.healthStatus}. Must be one of: ${validHealth.join(', ')}`);
  }

  if (typeof data.predictedIssue !== 'string' || !data.predictedIssue.trim()) {
    errors.push("Missing or invalid 'predictedIssue'.");
  }

  if (typeof data.estimatedFailureWindow !== 'string' || !data.estimatedFailureWindow.trim()) {
    errors.push("Missing or invalid 'estimatedFailureWindow'.");
  }

  if (typeof data.confidence !== 'number' || data.confidence < 0 || data.confidence > 1) {
    errors.push("'confidence' must be a number between 0 and 1.");
  }

  if (errors.length > 0) return { valid: false, errors };
  return { valid: true, result: data as MaintenanceRisk };
}

// ─── MaintenancePlan Validator ────────────────────────────────

export function validateMaintenancePlan(data: any): PredictiveValidationResult<MaintenancePlan> {
  const errors: string[] = [];

  if (!data || typeof data !== 'object') {
    return { valid: false, errors: ['Output is not a valid JSON object.'] };
  }

  if (typeof data.recommendedMaintenanceDate !== 'string') {
    errors.push("Missing 'recommendedMaintenanceDate'.");
  }

  if (typeof data.serviceInterval !== 'string') {
    errors.push("Missing 'serviceInterval'.");
  }

  if (!Array.isArray(data.recommendedActions) || data.recommendedActions.length === 0) {
    errors.push("'recommendedActions' must be a non-empty array.");
  }

  if (!Array.isArray(data.partsToInspect)) {
    errors.push("'partsToInspect' must be an array.");
  }

  if (typeof data.technicianType !== 'string') {
    errors.push("Missing 'technicianType'.");
  }

  if (errors.length > 0) return { valid: false, errors };
  return { valid: true, result: data as MaintenancePlan };
}

// ─── PreventiveRecommendation Validator ───────────────────────

export function validateRecommendation(data: any): PredictiveValidationResult<PreventiveRecommendation> {
  const errors: string[] = [];

  if (!data || typeof data !== 'object') {
    return { valid: false, errors: ['Output is not a valid JSON object.'] };
  }

  if (typeof data.title !== 'string' || !data.title.trim()) {
    errors.push("Missing or invalid 'title'.");
  }

  if (typeof data.message !== 'string' || !data.message.trim()) {
    errors.push("Missing or invalid 'message'.");
  }

  const validUrgency = ['immediate', 'soon', 'routine', 'informational'];
  if (!validUrgency.includes(data.urgency)) {
    errors.push(`Invalid 'urgency': ${data.urgency}. Must be one of: ${validUrgency.join(', ')}`);
  }

  if (!data.estimatedCost || typeof data.estimatedCost.min !== 'number' || typeof data.estimatedCost.max !== 'number') {
    errors.push("'estimatedCost' must have numeric 'min' and 'max'.");
  } else if (data.estimatedCost.min > data.estimatedCost.max) {
    errors.push("'estimatedCost.min' cannot exceed 'max'.");
  }

  if (errors.length > 0) return { valid: false, errors };
  return { valid: true, result: data as PreventiveRecommendation };
}

// ─── NotificationPlan Validator ───────────────────────────────

export function validateNotificationPlan(data: any): PredictiveValidationResult<NotificationPlan> {
  const errors: string[] = [];

  if (!data || typeof data !== 'object') {
    return { valid: false, errors: ['Output is not a valid JSON object.'] };
  }

  if (!data.push || typeof data.push.title !== 'string' || typeof data.push.body !== 'string') {
    errors.push("Invalid 'push' notification (requires title and body).");
  }

  if (!data.email || typeof data.email.subject !== 'string' || typeof data.email.body !== 'string') {
    errors.push("Invalid 'email' notification (requires subject and body).");
  }

  if (!data.sms || typeof data.sms.message !== 'string') {
    errors.push("Invalid 'sms' notification (requires message).");
  }

  if (!data.whatsapp || typeof data.whatsapp.message !== 'string') {
    errors.push("Invalid 'whatsapp' notification (requires message).");
  }

  if (errors.length > 0) return { valid: false, errors };
  return { valid: true, result: data as NotificationPlan };
}
