/**
 * FixNow AI Workflow 2 — Intelligent Booking Engine Types
 *
 * Defines the strict structured outputs for the booking reasoning workflow.
 */

import { TechnicianCategory, UrgencyLevel, DiagnosisResult } from '@/features/diagnosis';

// ─── Estimator Types ──────────────────────────────────────────

export interface RepairEstimate {
  estimatedCost: {
    min: number;
    max: number;
  };
  durationMinutes: number;
  requiredParts: string[];
  warrantyConsiderations: string;
}

// ─── Scheduler Types ──────────────────────────────────────────

export interface ScheduleRecommendation {
  preferredWindow: string;
  travelTimeConsideration: string;
  priority: string;
}

// ─── Technician Types ─────────────────────────────────────────

export interface TechnicianRecommendation {
  type: TechnicianCategory;
  requiredSkills: string[];
}

// ─── Planner Types (Combined Output) ──────────────────────────

export interface BookingPlan {
  /** The root issue identified from the DiagnosisResult. */
  problem: string;

  /** Recommended technician specialization. */
  technicianCategory: TechnicianCategory;

  /** Overall priority/urgency of the booking. */
  urgency: UrgencyLevel;

  /** Estimated cost range in INR. */
  estimatedCost: {
    min: number;
    max: number;
  };

  /** Estimated time required to complete the repair on-site (in minutes). */
  estimatedDurationMinutes: number;

  /** Specific parts the technician should bring. */
  requiredParts: string[];

  /** Specific skills needed (e.g. "PCB Repair", "Gas Charging"). */
  requiredSkills: string[];

  /** Suggested scheduling window (e.g. "Within 2 hours", "Tomorrow morning"). */
  recommendedAppointmentWindow: string;

  /** Contextual notes for the technician based on customer's input or history. */
  customerNotes: string;

  /** AI Confidence in this booking plan (0.0 to 1.0). */
  confidence: number;
}

// ─── Validation ───────────────────────────────────────────────

export interface BookingPlanValidationResult {
  valid: boolean;
  result?: BookingPlan;
  errors?: string[];
}
