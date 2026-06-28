/**
 * FixNow AI Workflow 5 — Warranty Intelligence Types
 */

export interface WarrantyExtraction {
  /** The identified document type. */
  documentType: 'Warranty Card' | 'Invoice' | 'Guarantee Card' | 'AMC';
  /** Extraction confidence (0.0 to 1.0) */
  confidence: number;
  brand: string;
  applianceType: string;
  modelNumber: string;
  serialNumber: string;
  customerName: string;
  purchaseDate: string;
  warrantyStartDate: string;
  warrantyEndDate: string;
  warrantyProvider: string;
  /** Boolean indicating if this is a FixNow platform warranty */
  isFixNowWarranty: boolean;
  /** List of parts/services covered */
  coverage: string[];
  /** List of parts/services specifically excluded */
  exclusions: string[];
  /** If it's an AMC, how many free services remain? */
  freeServicesRemaining: number;
  invoiceNumber: string;
  retailer: string;
  /** The raw OCR text (for reference) */
  ocrText: string;
}

export type WarrantyStatusCategory = 'Active' | 'Expired' | 'Unknown';

export interface RepairHistoryRecord {
  date: string;
  issue: string;
  technician: string;
  status: 'Completed' | 'Pending' | 'Cancelled';
  partsReplaced: string[];
}

export interface WarrantyDashboardPayload {
  /** The structured extraction output */
  extraction: WarrantyExtraction;
  /** Overall computed status */
  status: WarrantyStatusCategory;
  /** Days remaining (negative if expired) */
  remainingDays: number;
  /** Retrieved history from the database */
  repairHistory: RepairHistoryRecord[];
  /** Suggested actions for the UI (e.g., "Schedule Free Visit", "Renew Warranty") */
  smartSuggestions: string[];
}
