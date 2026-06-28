/**
 * FixNow AI Workflow 4 — Predictive Maintenance Intelligence Types
 *
 * Strongly typed interfaces for proactive failure prediction and
 * preventive maintenance planning. Consumes repair history from
 * Workflow 3 (RepairSummary) and appliance context.
 */

import { TechnicianCategory } from '@/features/diagnosis';

// ─── Appliance Context ────────────────────────────────────────

export interface ApplianceProfile {
  /** Appliance type (e.g., "Split AC", "Front Load Washing Machine"). */
  type: string;
  /** Manufacturer brand (e.g., "LG", "Samsung", "Daikin"). */
  brand: string;
  /** Model number or name. */
  model?: string;
  /** Approximate age in years. */
  ageYears?: number;
  /** Date of last professional service (ISO string). */
  lastServiceDate?: string;
}

export interface RepairHistoryEntry {
  /** What was the problem. */
  problem: string;
  /** Final outcome of the repair. */
  outcome: 'resolved' | 'partial' | 'escalated' | 'rescheduled';
  /** Date of the repair (ISO string). */
  date: string;
  /** Parts that were used. */
  partsUsed: string[];
  /** Technician type that handled it. */
  technicianType: TechnicianCategory;
  /** Any follow-up recommendations from the technician. */
  followUpNotes?: string;
}

// ─── Risk Analysis Output ─────────────────────────────────────

export type ApplianceHealth = 'Good' | 'Moderate' | 'At Risk' | 'Critical';

export interface MaintenanceRisk {
  /** Probability of failure (0.0 – 1.0). */
  riskScore: number;
  /** Overall health classification. */
  healthStatus: ApplianceHealth;
  /** The component or system most likely to fail. */
  predictedIssue: string;
  /** Estimated time until failure (e.g., "30 days", "90 days", "6 months"). */
  estimatedFailureWindow: string;
  /** AI confidence in this prediction (0.0 – 1.0). */
  confidence: number;
}

// ─── Maintenance Plan ─────────────────────────────────────────

export interface MaintenancePlan {
  /** Recommended date for preventive service (ISO string). */
  recommendedMaintenanceDate: string;
  /** Suggested service interval going forward (e.g., "Every 6 months"). */
  serviceInterval: string;
  /** Ordered list of inspection/maintenance actions. */
  recommendedActions: string[];
  /** Parts that should be proactively replaced or inspected. */
  partsToInspect: string[];
  /** Which technician category should perform the maintenance. */
  technicianType: TechnicianCategory;
}

// ─── Customer Recommendation ──────────────────────────────────

export type RecommendationUrgency = 'immediate' | 'soon' | 'routine' | 'informational';

export interface PreventiveRecommendation {
  /** Customer-friendly title (e.g., "Your AC needs attention"). */
  title: string;
  /** Plain-language explanation of the risk and recommendation. */
  message: string;
  /** How urgent this recommendation is. */
  urgency: RecommendationUrgency;
  /** Estimated cost of preventive service (INR). */
  estimatedCost: { min: number; max: number };
}

// ─── Notification Plan (Payloads Only — Not Sent) ─────────────

export interface NotificationPlan {
  push: { title: string; body: string };
  email: { subject: string; body: string };
  sms: { message: string };
  whatsapp: { message: string };
}

// ─── Validation ───────────────────────────────────────────────

export interface PredictiveValidationResult<T> {
  valid: boolean;
  result?: T;
  errors?: string[];
}
