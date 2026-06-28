/**
 * FixNow AI Workflow 7 — Integration & Orchestration Types
 *
 * Orchestration-level types that describe how data moves between
 * the six existing AI workflows. No business logic types here —
 * only coordination contracts.
 */

// ─── Workflow Identifiers ─────────────────────────────────────

export type WorkflowId =
  | 'multimodal'
  | 'diagnosis'
  | 'booking'
  | 'technician-copilot'
  | 'predictive-maintenance'
  | 'admin-intelligence';

// ─── Trigger Types ────────────────────────────────────────────

export type TriggerType =
  | 'customer_issue'
  | 'image_upload'
  | 'voice_input'
  | 'document_upload'
  | 'technician_assigned'
  | 'repair_completed'
  | 'admin_review'
  | 'daily_summary'
  | 'weekly_summary';

// ─── Workflow Step ────────────────────────────────────────────

export type StepStatus = 'pending' | 'running' | 'completed' | 'failed' | 'skipped';

export interface WorkflowStep {
  /** Which workflow this step belongs to. */
  workflowId: WorkflowId;
  /** Human-readable step name. */
  name: string;
  /** Current status. */
  status: StepStatus;
  /** The structured output of this step (typed by the consuming workflow). */
  output?: any;
  /** Error message if the step failed. */
  error?: string;
  /** Duration of this step in milliseconds. */
  durationMs?: number;
  /** ISO timestamp when this step started. */
  startedAt?: string;
  /** ISO timestamp when this step completed. */
  completedAt?: string;
}

// ─── Orchestration Request ────────────────────────────────────

export interface OrchestrationRequest {
  /** What triggered this orchestration. */
  trigger: TriggerType;
  /** Customer/admin user ID. */
  userId: string;
  /** Session ID for CascadeFlow context. */
  sessionId: string;
  /** Raw problem description (text). */
  problemText?: string;
  /** Image description (if image was uploaded). */
  imageDescription?: string;
  /** OCR text (if document was uploaded). */
  ocrText?: string;
  /** Layout description (for classification pipeline). */
  layoutDescription?: string;
  /** Audio description (if voice was used). */
  audioDescription?: string;
  /** Technician ID (if technician-related trigger). */
  technicianId?: string;
  /** Job ID (if related to a specific job). */
  jobId?: string;
  /** Any additional context as key-value pairs. */
  metadata?: Record<string, string>;
}

// ─── Orchestration Context ────────────────────────────────────

export interface OrchestrationContext {
  /** The original request. */
  request: OrchestrationRequest;
  /** Steps executed so far. */
  steps: WorkflowStep[];
  /** The current pipeline stage. */
  currentStage: string;
  /** Whether multimodal context was built. */
  hasMultimodalContext: boolean;
  /** Whether memory was recalled. */
  hasMemoryRecall: boolean;
  /** Whether a diagnosis was produced. */
  hasDiagnosis: boolean;
  /** Whether booking intelligence was generated. */
  hasBooking: boolean;
  /** Whether a technician work plan exists. */
  hasTechnicianPlan: boolean;
  /** Whether repair is completed. */
  isRepairCompleted: boolean;
}

// ─── Orchestration Result ─────────────────────────────────────

export type OrchestrationStatus = 'success' | 'partial' | 'failed';

export interface OrchestrationResult {
  /** Overall orchestration status. */
  status: OrchestrationStatus;
  /** What triggered this orchestration. */
  trigger: TriggerType;
  /** All executed steps. */
  steps: WorkflowStep[];
  /** Final aggregated output from all workflows. */
  outputs: Record<string, any>;
  /** Total orchestration duration in milliseconds. */
  totalDurationMs: number;
  /** ISO timestamp. */
  completedAt: string;
  /** Any warnings generated during orchestration. */
  warnings: string[];
}

// ─── Workflow Trigger ─────────────────────────────────────────

export interface WorkflowTrigger {
  /** The trigger type. */
  type: TriggerType;
  /** Which workflows should execute for this trigger. */
  workflowSequence: WorkflowId[];
  /** Human-readable description. */
  description: string;
}

// ─── Workflow Event ───────────────────────────────────────────

export interface WorkflowEvent {
  /** Event type. */
  type: 'step_started' | 'step_completed' | 'step_failed' | 'orchestration_completed';
  /** The step that generated this event. */
  step?: WorkflowStep;
  /** ISO timestamp. */
  timestamp: string;
  /** Additional event data. */
  data?: Record<string, any>;
}
