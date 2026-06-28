/**
 * FixNow AI Diagnosis Engine — Validator
 *
 * Never trust raw AI output.
 * Validates every field of DiagnosisResult against strict rules.
 * Returns typed ValidationResult: success with result, or failure with error list.
 */

import type {
  DiagnosisResult,
  UrgencyLevel,
  TechnicianCategory,
  ValidationResult,
} from './types';

// ─── Valid Values ─────────────────────────────────────────────

const VALID_URGENCY: readonly UrgencyLevel[] = ['Critical', 'High', 'Medium', 'Low'];

const VALID_TECHNICIAN_TYPES: readonly TechnicianCategory[] = [
  'Electrical', 'Plumbing', 'HVAC', 'Carpentry',
  'Cleaning', 'Painting', 'Appliance Repair', 'General',
];

// ─── Validator Class ──────────────────────────────────────────

export class DiagnosisValidator {
  /**
   * Validate a DiagnosisResult. Returns success with the validated result,
   * or failure with a list of human-readable error strings.
   */
  validate(result: DiagnosisResult | null | undefined): ValidationResult {
    if (!result || typeof result !== 'object') {
      return { valid: false, errors: ['Diagnosis result is null or not an object.'] };
    }

    const errors: string[] = [];

    // ── problem ──
    if (typeof result.problem !== 'string' || result.problem.trim().length < 3) {
      errors.push(`"problem" must be a string with at least 3 characters. Got: "${result.problem}"`);
    }

    // ── confidence ──
    if (typeof result.confidence !== 'number' || isNaN(result.confidence)) {
      errors.push(`"confidence" must be a number. Got: ${result.confidence}`);
    } else if (result.confidence < 0 || result.confidence > 1) {
      errors.push(`"confidence" must be between 0.0 and 1.0. Got: ${result.confidence}`);
    }

    // ── urgency ──
    if (!VALID_URGENCY.includes(result.urgency as UrgencyLevel)) {
      errors.push(`"urgency" must be one of ${VALID_URGENCY.join(', ')}. Got: "${result.urgency}"`);
    }

    // ── estimatedRepair ──
    if (typeof result.estimatedRepair !== 'string' || result.estimatedRepair.trim().length === 0) {
      errors.push(`"estimatedRepair" must be a non-empty string. Got: "${result.estimatedRepair}"`);
    }

    // ── estimatedCost ──
    if (typeof result.estimatedCost !== 'string' || result.estimatedCost.trim().length === 0) {
      errors.push(`"estimatedCost" must be a non-empty string. Got: "${result.estimatedCost}"`);
    }

    // ── estimatedTime ──
    if (typeof result.estimatedTime !== 'string' || result.estimatedTime.trim().length === 0) {
      errors.push(`"estimatedTime" must be a non-empty string. Got: "${result.estimatedTime}"`);
    }

    // ── recommendedTechnicianType ──
    if (!VALID_TECHNICIAN_TYPES.includes(result.recommendedTechnicianType as TechnicianCategory)) {
      errors.push(
        `"recommendedTechnicianType" must be one of ${VALID_TECHNICIAN_TYPES.join(', ')}. Got: "${result.recommendedTechnicianType}"`
      );
    }

    // ── safetyAdvice ──
    if (typeof result.safetyAdvice !== 'string' || result.safetyAdvice.trim().length === 0) {
      errors.push(`"safetyAdvice" must be a non-empty string. Got: "${result.safetyAdvice}"`);
    }

    // ── suggestedNextAction ──
    if (typeof result.suggestedNextAction !== 'string' || result.suggestedNextAction.trim().length === 0) {
      errors.push(`"suggestedNextAction" must be a non-empty string. Got: "${result.suggestedNextAction}"`);
    }

    // ── needsEmergencyVisit ──
    if (typeof result.needsEmergencyVisit !== 'boolean') {
      errors.push(`"needsEmergencyVisit" must be a boolean. Got: ${typeof result.needsEmergencyVisit}`);
    }

    // ── Result ──
    if (errors.length > 0) {
      return { valid: false, errors };
    }

    return { valid: true, result };
  }
}

export const diagnosisValidator = new DiagnosisValidator();
