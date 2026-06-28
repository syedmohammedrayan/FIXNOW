/**
 * FixNow AI Workflow 3 — Technician Copilot Types
 *
 * Strongly typed interfaces for the technician-facing AI reasoning workflow.
 * Consumes DiagnosisResult (Workflow 1) and BookingPlan (Workflow 2) as inputs.
 */

import { TechnicianCategory, UrgencyLevel } from '@/features/diagnosis';

// ─── Repair Outcome ───────────────────────────────────────────

export type RepairOutcome = 'resolved' | 'partial' | 'escalated' | 'rescheduled';

export type RepairDifficulty = 'Easy' | 'Medium' | 'Hard' | 'Expert';

// ─── Parts Prediction ─────────────────────────────────────────

export interface PartsPrediction {
  /** Parts absolutely required for this repair. */
  required: string[];
  /** Parts that may be needed depending on on-site inspection. */
  optional: string[];
  /** Consumable items (tape, sealant, grease, etc.). */
  consumables: string[];
}

// ─── Repair Checklist ─────────────────────────────────────────

export interface ChecklistStep {
  /** Step order (1-based). */
  order: number;
  /** Human-readable instruction. */
  instruction: string;
  /** Whether this step involves a safety-critical action. */
  isSafetyCritical: boolean;
}

export interface RepairChecklist {
  steps: ChecklistStep[];
}

// ─── Safety Checklist ─────────────────────────────────────────

export type SafetySeverity = 'critical' | 'warning' | 'info';

export interface SafetyWarning {
  /** Category of safety concern (electrical, chemical, mechanical, thermal). */
  category: string;
  /** Specific safety instruction. */
  instruction: string;
  /** How severe the risk is. */
  severity: SafetySeverity;
}

export interface SafetyChecklist {
  warnings: SafetyWarning[];
}

// ─── Technician Work Plan (Primary Output) ────────────────────

export interface TechnicianWorkPlan {
  /** The root problem from Diagnosis. */
  problem: string;

  /** The technician specialization required. */
  technicianType: TechnicianCategory;

  /** Estimated on-site repair duration (e.g. "2 hours"). */
  estimatedDuration: string;

  /** AI-assessed repair difficulty. */
  repairDifficulty: RepairDifficulty;

  /** Predicted parts breakdown. */
  parts: PartsPrediction;

  /** Step-by-step repair checklist. */
  checklist: RepairChecklist;

  /** Safety warnings and protocols. */
  safety: SafetyChecklist;

  /** Notes the technician should communicate to the customer. */
  customerNotes: string;

  /** AI confidence in this work plan (0.0 – 1.0). */
  confidence: number;
}

// ─── Repair Summary (Post-Repair, for Hindsight) ──────────────

export interface RepairSummary {
  /** What was the original problem. */
  problem: string;

  /** What repair actions were performed. */
  actionsTaken: string[];

  /** Parts that were actually used. */
  partsUsed: string[];

  /** Final outcome. */
  outcome: RepairOutcome;

  /** Actual time spent on-site (in minutes). */
  actualDurationMinutes: number;

  /** Any follow-up recommendations. */
  followUpRecommendations: string;

  /** Free-form technician notes. */
  technicianNotes: string;
}

// ─── Validation ───────────────────────────────────────────────

export interface CopilotValidationResult {
  valid: boolean;
  result?: TechnicianWorkPlan;
  errors?: string[];
}
