/**
 * FixNow AI Workflow 2 — Intelligent Booking Engine Validator
 */

import { BookingPlan, BookingPlanValidationResult } from './types';

export function validateBookingPlan(data: any): BookingPlanValidationResult {
  const errors: string[] = [];

  if (!data || typeof data !== 'object') {
    return { valid: false, errors: ['Output is not a valid JSON object.'] };
  }

  // problem
  if (typeof data.problem !== 'string' || !data.problem.trim()) {
    errors.push("Missing or invalid 'problem' string.");
  }

  // technicianCategory
  const validCategories = [
    'Electrical', 'Plumbing', 'HVAC', 'Carpentry',
    'Cleaning', 'Painting', 'Appliance Repair', 'General'
  ];
  if (!validCategories.includes(data.technicianCategory)) {
    errors.push(`Invalid 'technicianCategory': ${data.technicianCategory}`);
  }

  // urgency
  if (!['Critical', 'High', 'Medium', 'Low'].includes(data.urgency)) {
    errors.push(`Invalid 'urgency': ${data.urgency}`);
  }

  // estimatedCost
  if (
    !data.estimatedCost ||
    typeof data.estimatedCost.min !== 'number' ||
    typeof data.estimatedCost.max !== 'number'
  ) {
    errors.push("Missing or invalid 'estimatedCost' (requires min and max numbers).");
  } else if (data.estimatedCost.min > data.estimatedCost.max) {
    errors.push("'estimatedCost.min' cannot be greater than 'max'.");
  }

  // estimatedDurationMinutes
  if (typeof data.estimatedDurationMinutes !== 'number' || data.estimatedDurationMinutes <= 0) {
    errors.push("Missing or invalid 'estimatedDurationMinutes'. Must be > 0.");
  }

  // arrays
  if (!Array.isArray(data.requiredParts)) {
    errors.push("'requiredParts' must be an array of strings.");
  }
  if (!Array.isArray(data.requiredSkills)) {
    errors.push("'requiredSkills' must be an array of strings.");
  }

  // strings
  if (typeof data.recommendedAppointmentWindow !== 'string') {
    errors.push("Missing or invalid 'recommendedAppointmentWindow'.");
  }
  if (typeof data.customerNotes !== 'string') {
    errors.push("Missing or invalid 'customerNotes'.");
  }

  // confidence
  if (typeof data.confidence !== 'number' || data.confidence < 0 || data.confidence > 1) {
    errors.push("'confidence' must be a number between 0 and 1.");
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  return {
    valid: true,
    result: {
      problem: data.problem,
      technicianCategory: data.technicianCategory,
      urgency: data.urgency,
      estimatedCost: {
        min: data.estimatedCost.min,
        max: data.estimatedCost.max
      },
      estimatedDurationMinutes: data.estimatedDurationMinutes,
      requiredParts: data.requiredParts,
      requiredSkills: data.requiredSkills,
      recommendedAppointmentWindow: data.recommendedAppointmentWindow,
      customerNotes: data.customerNotes,
      confidence: data.confidence
    }
  };
}
