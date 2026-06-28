/**
 * FixNow AI Workflow 6 — Admin Intelligence Validator
 *
 * Strict validation for every admin intelligence output type.
 * Rejects malformed or incomplete AI responses.
 */

import {
  OperationsSummary,
  TechnicianPerformanceInsight,
  CustomerRiskInsight,
  RecurringFaultInsight,
  SLAComplianceInsight,
  ModelUsageInsight,
  WeeklyAdminBrief,
  AdminAlert,
  AdminValidationResult
} from './types';

// ─── Operations Summary ───────────────────────────────────────

export function validateOperationsSummary(data: any): AdminValidationResult<OperationsSummary> {
  const errors: string[] = [];
  if (!data || typeof data !== 'object') return { valid: false, errors: ['Invalid object.'] };

  if (typeof data.period !== 'string') errors.push("Missing 'period'.");
  if (typeof data.totalJobs !== 'number') errors.push("Missing 'totalJobs'.");
  if (typeof data.completedJobs !== 'number') errors.push("Missing 'completedJobs'.");
  if (typeof data.failedJobs !== 'number') errors.push("Missing 'failedJobs'.");
  if (typeof data.unresolvedJobs !== 'number') errors.push("Missing 'unresolvedJobs'.");
  if (typeof data.urgentCases !== 'number') errors.push("Missing 'urgentCases'.");
  if (!Array.isArray(data.topCategories)) errors.push("'topCategories' must be an array.");
  if (!Array.isArray(data.topFailureTypes)) errors.push("'topFailureTypes' must be an array.");
  if (!Array.isArray(data.topTechnicians)) errors.push("'topTechnicians' must be an array.");

  if (errors.length > 0) return { valid: false, errors };
  return { valid: true, result: data as OperationsSummary };
}

// ─── Technician Performance ───────────────────────────────────

export function validateTechnicianPerformance(data: any): AdminValidationResult<TechnicianPerformanceInsight> {
  const errors: string[] = [];
  if (!data || typeof data !== 'object') return { valid: false, errors: ['Invalid object.'] };

  if (typeof data.technicianId !== 'string') errors.push("Missing 'technicianId'.");
  if (typeof data.technicianName !== 'string') errors.push("Missing 'technicianName'.");

  const validRatings = ['Excellent', 'Good', 'Average', 'Below Average', 'Critical'];
  if (!validRatings.includes(data.rating)) errors.push(`Invalid 'rating': ${data.rating}.`);

  if (typeof data.successRate !== 'number' || data.successRate < 0 || data.successRate > 1)
    errors.push("'successRate' must be 0.0–1.0.");
  if (typeof data.avgCompletionMinutes !== 'number') errors.push("Missing 'avgCompletionMinutes'.");
  if (typeof data.repeatFailureRate !== 'number') errors.push("Missing 'repeatFailureRate'.");
  if (typeof data.customerFeedbackScore !== 'number') errors.push("Missing 'customerFeedbackScore'.");
  if (typeof data.escalationCount !== 'number') errors.push("Missing 'escalationCount'.");
  if (!Array.isArray(data.recommendations)) errors.push("'recommendations' must be an array.");

  if (errors.length > 0) return { valid: false, errors };
  return { valid: true, result: data as TechnicianPerformanceInsight };
}

// ─── Customer Risk ────────────────────────────────────────────

export function validateCustomerRisk(data: any): AdminValidationResult<CustomerRiskInsight> {
  const errors: string[] = [];
  if (!data || typeof data !== 'object') return { valid: false, errors: ['Invalid object.'] };

  if (typeof data.customerId !== 'string') errors.push("Missing 'customerId'.");
  if (typeof data.customerName !== 'string') errors.push("Missing 'customerName'.");
  if (typeof data.riskScore !== 'number' || data.riskScore < 0 || data.riskScore > 1)
    errors.push("'riskScore' must be 0.0–1.0.");

  const validLevels = ['Low', 'Medium', 'High', 'Critical'];
  if (!validLevels.includes(data.riskLevel)) errors.push(`Invalid 'riskLevel': ${data.riskLevel}.`);

  if (!Array.isArray(data.riskFactors)) errors.push("'riskFactors' must be an array.");
  if (!Array.isArray(data.mitigationActions)) errors.push("'mitigationActions' must be an array.");

  if (errors.length > 0) return { valid: false, errors };
  return { valid: true, result: data as CustomerRiskInsight };
}

// ─── Recurring Faults ─────────────────────────────────────────

export function validateRecurringFault(data: any): AdminValidationResult<RecurringFaultInsight> {
  const errors: string[] = [];
  if (!data || typeof data !== 'object') return { valid: false, errors: ['Invalid object.'] };

  if (typeof data.appliancePattern !== 'string') errors.push("Missing 'appliancePattern'.");
  if (typeof data.faultType !== 'string') errors.push("Missing 'faultType'.");
  if (typeof data.occurrences !== 'number') errors.push("Missing 'occurrences'.");

  const validTrends = ['Increasing', 'Stable', 'Decreasing'];
  if (!validTrends.includes(data.trend)) errors.push(`Invalid 'trend': ${data.trend}.`);

  if (typeof data.changePercent !== 'number') errors.push("Missing 'changePercent'.");
  if (typeof data.probableRootCause !== 'string') errors.push("Missing 'probableRootCause'.");
  if (typeof data.recommendation !== 'string') errors.push("Missing 'recommendation'.");

  if (errors.length > 0) return { valid: false, errors };
  return { valid: true, result: data as RecurringFaultInsight };
}

// ─── SLA Compliance ───────────────────────────────────────────

export function validateSLACompliance(data: any): AdminValidationResult<SLAComplianceInsight> {
  const errors: string[] = [];
  if (!data || typeof data !== 'object') return { valid: false, errors: ['Invalid object.'] };

  if (typeof data.jobId !== 'string') errors.push("Missing 'jobId'.");
  if (typeof data.customerId !== 'string') errors.push("Missing 'customerId'.");

  const validStatuses = ['On Track', 'At Risk', 'Breached'];
  if (!validStatuses.includes(data.status)) errors.push(`Invalid 'status': ${data.status}.`);

  if (typeof data.missRiskScore !== 'number' || data.missRiskScore < 0 || data.missRiskScore > 1)
    errors.push("'missRiskScore' must be 0.0–1.0.");
  if (typeof data.estimatedDelayHours !== 'number') errors.push("Missing 'estimatedDelayHours'.");
  if (!Array.isArray(data.riskFactors)) errors.push("'riskFactors' must be an array.");
  if (!Array.isArray(data.interventions)) errors.push("'interventions' must be an array.");

  if (errors.length > 0) return { valid: false, errors };
  return { valid: true, result: data as SLAComplianceInsight };
}

// ─── Model Usage ──────────────────────────────────────────────

export function validateModelUsage(data: any): AdminValidationResult<ModelUsageInsight> {
  const errors: string[] = [];
  if (!data || typeof data !== 'object') return { valid: false, errors: ['Invalid object.'] };

  if (typeof data.period !== 'string') errors.push("Missing 'period'.");
  if (typeof data.totalCalls !== 'number') errors.push("Missing 'totalCalls'.");
  if (!Array.isArray(data.modelBreakdown)) errors.push("'modelBreakdown' must be an array.");
  if (typeof data.escalationRate !== 'number') errors.push("Missing 'escalationRate'.");
  if (typeof data.qualityGateFailureRate !== 'number') errors.push("Missing 'qualityGateFailureRate'.");
  if (!Array.isArray(data.costRecommendations)) errors.push("'costRecommendations' must be an array.");

  if (errors.length > 0) return { valid: false, errors };
  return { valid: true, result: data as ModelUsageInsight };
}

// ─── Admin Alert ──────────────────────────────────────────────

export function validateAdminAlert(data: any): AdminValidationResult<AdminAlert> {
  const errors: string[] = [];
  if (!data || typeof data !== 'object') return { valid: false, errors: ['Invalid object.'] };

  if (typeof data.title !== 'string') errors.push("Missing 'title'.");
  if (typeof data.description !== 'string') errors.push("Missing 'description'.");

  const validSeverities = ['Info', 'Warning', 'Critical'];
  if (!validSeverities.includes(data.severity)) errors.push(`Invalid 'severity': ${data.severity}.`);

  const validCategories = ['technician', 'customer', 'sla', 'fault', 'cost', 'operations'];
  if (!validCategories.includes(data.category)) errors.push(`Invalid 'category': ${data.category}.`);

  if (typeof data.recommendedAction !== 'string') errors.push("Missing 'recommendedAction'.");
  if (typeof data.timestamp !== 'string') errors.push("Missing 'timestamp'.");

  if (errors.length > 0) return { valid: false, errors };
  return { valid: true, result: data as AdminAlert };
}
