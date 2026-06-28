/**
 * FixNow Memory Types
 * 
 * Strict interfaces for durable knowledge stored in Hindsight Cloud.
 * Only store facts that persist across conversations — never store
 * greetings, small talk, or transient exchanges.
 */

export interface CustomerMemory {
  userId: string;
  appliances: ApplianceInfo[];
  preferences: CustomerPreference;
  repairHistory: RepairMemory[];
}

export interface ApplianceInfo {
  type: string;        // e.g. "AC", "Washing Machine"
  brand: string;       // e.g. "LG"
  model?: string;      // e.g. "Dual Inverter"
  warrantyExpiry?: string;
}

export interface CustomerPreference {
  preferredTechnician?: string;
  preferredLanguage?: string;
  preferredTimeSlot?: string;
  serviceFrequency?: string;
}

export interface TechnicianMemory {
  technicianId: string;
  specializations: string[];
  completedRepairs: RepairInsight[];
  certifications?: string[];
}

export interface RepairMemory {
  issue: string;
  solution: string;
  appliance?: string;
  technicianName?: string;
  date?: string;
  outcome: 'success' | 'partial' | 'failed';
}

export interface RepairInsight {
  category: string;
  commonIssue: string;
  bestPractice: string;
  toolsRequired?: string[];
}

export interface MemoryRecallResult {
  memories: string[];
  bankId: string;
  query: string;
}

export interface MemoryRetainResult {
  success: boolean;
  bankId: string;
}
