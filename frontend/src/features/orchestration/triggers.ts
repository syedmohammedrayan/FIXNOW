/**
 * FixNow AI Workflow 7 — Trigger Definitions
 *
 * Defines when each workflow should run based on the trigger type.
 * Maps platform events to the correct workflow execution sequence.
 */

import { WorkflowTrigger, TriggerType, WorkflowId } from './types';

// ─── Trigger Definitions ──────────────────────────────────────

const TRIGGER_MAP: Record<TriggerType, WorkflowTrigger> = {
  customer_issue: {
    type: 'customer_issue',
    workflowSequence: ['multimodal', 'diagnosis', 'booking'],
    description: 'Customer reports an issue via text. Run multimodal context, diagnose, and generate booking plan.'
  },
  image_upload: {
    type: 'image_upload',
    workflowSequence: ['multimodal', 'diagnosis', 'booking'],
    description: 'Customer uploads an image. Classify, then route to diagnosis or warranty pipeline.'
  },
  voice_input: {
    type: 'voice_input',
    workflowSequence: ['multimodal', 'diagnosis', 'booking'],
    description: 'Customer provides voice input. Transcribe, translate, diagnose, and generate booking plan.'
  },
  document_upload: {
    type: 'document_upload',
    workflowSequence: ['multimodal'],
    description: 'Customer uploads a warranty card, invoice, or receipt. Route to warranty intelligence pipeline.'
  },
  technician_assigned: {
    type: 'technician_assigned',
    workflowSequence: ['technician-copilot'],
    description: 'Technician is assigned to a job. Generate work plan, parts prediction, checklist, and safety guide.'
  },
  repair_completed: {
    type: 'repair_completed',
    workflowSequence: ['technician-copilot', 'predictive-maintenance'],
    description: 'Repair is completed. Generate summary, retain memory, and update predictive maintenance.'
  },
  admin_review: {
    type: 'admin_review',
    workflowSequence: ['admin-intelligence'],
    description: 'Admin requests operational insights.'
  },
  daily_summary: {
    type: 'daily_summary',
    workflowSequence: ['admin-intelligence'],
    description: 'Generate daily operations summary and alerts.'
  },
  weekly_summary: {
    type: 'weekly_summary',
    workflowSequence: ['admin-intelligence'],
    description: 'Generate comprehensive weekly admin brief.'
  }
};

// ─── Trigger Resolver ─────────────────────────────────────────

export class TriggerResolver {
  /**
   * Returns the workflow trigger definition for a given trigger type.
   */
  resolve(triggerType: TriggerType): WorkflowTrigger {
    return TRIGGER_MAP[triggerType];
  }

  /**
   * Returns the ordered list of workflows to execute for a trigger.
   */
  getWorkflowSequence(triggerType: TriggerType): WorkflowId[] {
    return TRIGGER_MAP[triggerType].workflowSequence;
  }

  /**
   * Lists all defined triggers.
   */
  listAll(): WorkflowTrigger[] {
    return Object.values(TRIGGER_MAP);
  }
}
