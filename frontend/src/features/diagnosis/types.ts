/**
 * FixNow AI Diagnosis Engine — Type Definitions
 *
 * Core interfaces for the structured diagnosis pipeline.
 * Every downstream module (Booking, Technician Copilot, Pricing)
 * consumes DiagnosisResult as its input contract.
 */

// ─── Enums & Unions ───────────────────────────────────────────

export type UrgencyLevel = 'Critical' | 'High' | 'Medium' | 'Low';

export type TechnicianCategory =
  | 'Electrical'
  | 'Plumbing'
  | 'HVAC'
  | 'Carpentry'
  | 'Cleaning'
  | 'Painting'
  | 'Appliance Repair'
  | 'General';

// ─── Input ────────────────────────────────────────────────────

export interface DiagnosisRequest {
  /** The customer's problem description in plain text. */
  problem: string;

  /** Optional text description of an uploaded image. Actual OCR/vision is Module 7. */
  imageDescription?: string;

  /** Optional appliance context (brand, model, type) to improve accuracy. */
  applianceInfo?: {
    type?: string;
    brand?: string;
    model?: string;
  };

  /** Customer user ID for memory scoping. Defaults to 'anonymous'. */
  userId?: string;

  /** Session ID for tracking the diagnosis conversation. */
  sessionId?: string;
}

// ─── Output ───────────────────────────────────────────────────

export interface DiagnosisResult {
  /** Identified problem summary. */
  problem: string;

  /** Model confidence in the diagnosis, 0.0 – 1.0. */
  confidence: number;

  /** Urgency classification. */
  urgency: UrgencyLevel;

  /** Recommended repair action. */
  estimatedRepair: string;

  /** Estimated cost range as a display string (e.g. "₹1800-2200"). */
  estimatedCost: string;

  /** Estimated time to complete the repair (e.g. "2 hours"). */
  estimatedTime: string;

  /** The technician specialization needed. */
  recommendedTechnicianType: TechnicianCategory;

  /** Safety precautions the customer should take immediately. */
  safetyAdvice: string;

  /** What the customer should do next (e.g. "Book an HVAC technician"). */
  suggestedNextAction: string;

  /** Whether this requires an emergency/same-day visit. */
  needsEmergencyVisit: boolean;
}

// ─── Validation ───────────────────────────────────────────────

export interface ValidationSuccess {
  valid: true;
  result: DiagnosisResult;
}

export interface ValidationFailure {
  valid: false;
  errors: string[];
}

export type ValidationResult = ValidationSuccess | ValidationFailure;
