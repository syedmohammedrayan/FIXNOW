/**
 * FixNow AI Workflow 5 — Multimodal Service Intelligence Types
 *
 * Defines the structured outputs for voice, image, OCR, and the
 * unified MultimodalContext that feeds all downstream workflows.
 */

// ─── Supported Languages ──────────────────────────────────────

export type SupportedLanguage =
  | 'English'
  | 'Hindi'
  | 'Tamil'
  | 'Telugu'
  | 'Kannada'
  | 'Malayalam'
  | 'Bengali'
  | 'Gujarati'
  | 'Marathi'
  | 'Punjabi'
  | 'Odia'
  | 'Urdu'
  | 'Assamese'
  | 'Other';

// ─── Voice Types ──────────────────────────────────────────────

export interface VoiceTranscript {
  /** Transcribed text (in original language). */
  text: string;
  /** Detected spoken language. */
  detectedLanguage: SupportedLanguage;
  /** English translation of the transcript. */
  translatedText: string;
  /** Transcription confidence (0.0 – 1.0). */
  confidence: number;
}

// ─── Image Types ──────────────────────────────────────────────

export type ApplianceType =
  | 'AC'
  | 'Refrigerator'
  | 'Washing Machine'
  | 'Microwave'
  | 'Chimney'
  | 'Water Purifier'
  | 'TV'
  | 'Geyser'
  | 'Dishwasher'
  | 'Fan'
  | 'Electrical'
  | 'Plumbing'
  | 'Other';

export type DamageSeverity = 'None' | 'Minor' | 'Moderate' | 'Severe' | 'Critical';

export interface ImageAnalysis {
  /** Identified appliance type. */
  applianceType: ApplianceType;
  /** Detected brand (if visible). */
  brand: string;
  /** Detected model (if visible). */
  model: string;
  /** List of visible defects or issues. */
  visibleDefects: string[];
  /** Overall damage severity. */
  damageSeverity: DamageSeverity;
  /** Analysis confidence (0.0 – 1.0). */
  confidence: number;
}

// ─── Document / OCR Types ─────────────────────────────────────

export type DocumentType =
  | 'warranty_card'
  | 'invoice'
  | 'service_receipt'
  | 'appliance_label'
  | 'user_manual'
  | 'unknown';

export interface OCRResult {
  /** Raw extracted text from the document. */
  rawText: string;
  /** Classified document type. */
  documentType: DocumentType;
  /** Key-value pairs extracted from the document. */
  extractedFields: Record<string, string>;
  /** Extraction confidence (0.0 – 1.0). */
  confidence: number;
}

// ─── Parsed Appliance Info ────────────────────────────────────

export type WarrantyStatus = 'Valid' | 'Expired' | 'Unknown';

export interface ApplianceInfo {
  /** Brand name. */
  brand: string;
  /** Appliance type. */
  type: string;
  /** Model name or number. */
  model: string;
  /** Serial number (if found). */
  serialNumber: string;
  /** Warranty status. */
  warrantyStatus: WarrantyStatus;
  /** Warranty expiry date (ISO string, if found). */
  warrantyExpiry: string;
}

// ─── Unified Multimodal Context ───────────────────────────────

export interface MultimodalContext {
  /** Voice transcript and translation (if voice input was provided). */
  voice?: VoiceTranscript;
  /** Image analysis result (if image input was provided). */
  image?: ImageAnalysis;
  /** OCR extraction result (if document input was provided). */
  document?: OCRResult;
  /** Parsed appliance information (merged from all sources). */
  appliance?: ApplianceInfo;
  /** Raw user text input (if provided). */
  userText?: string;
  /** Summary of the problem extracted from all modalities. */
  problemSummary: string;
  /** Detected input language. */
  language: SupportedLanguage;
  /** Overall context confidence (0.0 – 1.0). */
  confidence: number;
}

// ─── Validation ───────────────────────────────────────────────

export interface MultimodalValidationResult<T> {
  valid: boolean;
  result?: T;
  errors?: string[];
}

export * from './warranty/types';
