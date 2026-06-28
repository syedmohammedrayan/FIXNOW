/**
 * FixNow AI Workflow 7 — Workflow Registry
 *
 * Registers and exposes the 6 existing workflow modules.
 * No business logic here — only registration and lookup.
 */

import { DiagnosisService } from '@/features/diagnosis/service';
import { BookingIntelligenceService } from '@/features/booking-ai/service';
import { TechnicianCopilotService } from '@/features/technician-copilot/service';
import { PredictiveMaintenanceService } from '@/features/predictive-maintenance/service';
import { MultimodalService } from '@/features/multimodal/service';
import { AdminIntelligenceService } from '@/features/admin-intelligence/service';
import { WorkflowId } from './types';

// ─── Registry Entry ───────────────────────────────────────────

export interface WorkflowRegistryEntry {
  id: WorkflowId;
  name: string;
  description: string;
  service: any;
}

// ─── Workflow Registry ────────────────────────────────────────

export class WorkflowRegistry {
  private entries: Map<WorkflowId, WorkflowRegistryEntry> = new Map();

  /** The actual service instances. */
  readonly diagnosis: DiagnosisService;
  readonly booking: BookingIntelligenceService;
  readonly technicianCopilot: TechnicianCopilotService;
  readonly predictiveMaintenance: PredictiveMaintenanceService;
  readonly multimodal: MultimodalService;
  readonly adminIntelligence: AdminIntelligenceService;

  constructor() {
    this.diagnosis = new DiagnosisService();
    this.booking = new BookingIntelligenceService();
    this.technicianCopilot = new TechnicianCopilotService();
    this.predictiveMaintenance = new PredictiveMaintenanceService();
    this.multimodal = new MultimodalService();
    this.adminIntelligence = new AdminIntelligenceService();

    this.register({
      id: 'diagnosis',
      name: 'Smart Diagnosis',
      description: 'AI-powered fault diagnosis from text, image, or voice input.',
      service: this.diagnosis
    });

    this.register({
      id: 'booking',
      name: 'Intelligent Booking',
      description: 'Generates booking plans, repair estimates, schedule recommendations, and technician matches.',
      service: this.booking
    });

    this.register({
      id: 'technician-copilot',
      name: 'Technician Copilot',
      description: 'Generates work plans, parts predictions, repair checklists, safety guides, and repair summaries.',
      service: this.technicianCopilot
    });

    this.register({
      id: 'predictive-maintenance',
      name: 'Predictive Maintenance',
      description: 'Predicts appliance failures, generates maintenance plans, and provides preventive recommendations.',
      service: this.predictiveMaintenance
    });

    this.register({
      id: 'multimodal',
      name: 'Multimodal Service Intelligence',
      description: 'Processes voice, image, and document inputs into a unified context. Includes classification pipeline and warranty intelligence.',
      service: this.multimodal
    });

    this.register({
      id: 'admin-intelligence',
      name: 'Operations & Admin Intelligence',
      description: 'Generates operational summaries, technician performance insights, customer risk analysis, and model usage reports.',
      service: this.adminIntelligence
    });
  }

  private register(entry: WorkflowRegistryEntry): void {
    this.entries.set(entry.id, entry);
  }

  /** Look up a workflow by ID. */
  get(id: WorkflowId): WorkflowRegistryEntry | undefined {
    return this.entries.get(id);
  }

  /** List all registered workflows. */
  listAll(): WorkflowRegistryEntry[] {
    return Array.from(this.entries.values());
  }

  /** Check if a workflow is registered. */
  has(id: WorkflowId): boolean {
    return this.entries.has(id);
  }
}
