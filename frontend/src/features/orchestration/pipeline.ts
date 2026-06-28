/**
 * FixNow AI Workflow 7 — Pipeline Definitions
 *
 * Defines the execution sequences for the platform.
 * This file describes what happens first, second, and third —
 * the Coordinator executes these pipelines.
 */

import { WorkflowId } from './types';

// ─── Pipeline Definition ──────────────────────────────────────

export interface PipelineStage {
  /** Which workflow to execute. */
  workflowId: WorkflowId;
  /** Human-readable name for this stage. */
  name: string;
  /** Whether this stage can be skipped if data is missing. */
  optional: boolean;
  /** Which previous stages must have completed for this to run. */
  dependsOn: WorkflowId[];
}

export interface PipelineDefinition {
  /** Pipeline name. */
  name: string;
  /** Ordered list of stages. */
  stages: PipelineStage[];
}

// ─── Customer Issue Pipeline ──────────────────────────────────

export const CUSTOMER_ISSUE_PIPELINE: PipelineDefinition = {
  name: 'Customer Issue Resolution',
  stages: [
    {
      workflowId: 'multimodal',
      name: 'Build Multimodal Context',
      optional: true,
      dependsOn: []
    },
    {
      workflowId: 'diagnosis',
      name: 'Smart Diagnosis',
      optional: false,
      dependsOn: []
    },
    {
      workflowId: 'booking',
      name: 'Intelligent Booking',
      optional: false,
      dependsOn: ['diagnosis']
    }
  ]
};

// ─── Technician Assignment Pipeline ───────────────────────────

export const TECHNICIAN_ASSIGNMENT_PIPELINE: PipelineDefinition = {
  name: 'Technician Preparation',
  stages: [
    {
      workflowId: 'technician-copilot',
      name: 'Generate Work Plan & Checklists',
      optional: false,
      dependsOn: []
    }
  ]
};

// ─── Repair Completion Pipeline ───────────────────────────────

export const REPAIR_COMPLETION_PIPELINE: PipelineDefinition = {
  name: 'Post-Repair Processing',
  stages: [
    {
      workflowId: 'technician-copilot',
      name: 'Generate Repair Summary',
      optional: false,
      dependsOn: []
    },
    {
      workflowId: 'predictive-maintenance',
      name: 'Update Predictive Maintenance',
      optional: true,
      dependsOn: ['technician-copilot']
    },
    {
      workflowId: 'admin-intelligence',
      name: 'Generate Post-Repair Insights',
      optional: true,
      dependsOn: ['technician-copilot']
    }
  ]
};

// ─── Admin Review Pipeline ────────────────────────────────────

export const ADMIN_REVIEW_PIPELINE: PipelineDefinition = {
  name: 'Admin Intelligence Review',
  stages: [
    {
      workflowId: 'admin-intelligence',
      name: 'Generate Operational Insights',
      optional: false,
      dependsOn: []
    }
  ]
};

// ─── Daily Orchestration Pipeline ─────────────────────────────

export const DAILY_ORCHESTRATION_PIPELINE: PipelineDefinition = {
  name: 'Daily Platform Orchestration',
  stages: [
    {
      workflowId: 'admin-intelligence',
      name: 'Generate Daily Operations Summary',
      optional: false,
      dependsOn: []
    },
    {
      workflowId: 'predictive-maintenance',
      name: 'Run Predictive Maintenance Sweep',
      optional: true,
      dependsOn: []
    }
  ]
};

// ─── Pipeline Registry ────────────────────────────────────────

export class PipelineRegistry {
  private pipelines: Map<string, PipelineDefinition> = new Map();

  constructor() {
    this.pipelines.set('customer_issue', CUSTOMER_ISSUE_PIPELINE);
    this.pipelines.set('image_upload', CUSTOMER_ISSUE_PIPELINE);
    this.pipelines.set('voice_input', CUSTOMER_ISSUE_PIPELINE);
    this.pipelines.set('document_upload', CUSTOMER_ISSUE_PIPELINE);
    this.pipelines.set('technician_assigned', TECHNICIAN_ASSIGNMENT_PIPELINE);
    this.pipelines.set('repair_completed', REPAIR_COMPLETION_PIPELINE);
    this.pipelines.set('admin_review', ADMIN_REVIEW_PIPELINE);
    this.pipelines.set('daily_summary', DAILY_ORCHESTRATION_PIPELINE);
    this.pipelines.set('weekly_summary', ADMIN_REVIEW_PIPELINE);
  }

  get(triggerType: string): PipelineDefinition | undefined {
    return this.pipelines.get(triggerType);
  }
}
