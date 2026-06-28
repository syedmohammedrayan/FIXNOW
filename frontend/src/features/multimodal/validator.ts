/**
 * FixNow AI Workflow 5 — Multimodal Validator
 *
 * Validates every extracted field across all modalities to ensure
 * data integrity before passing to downstream workflows.
 */

import {
  VoiceTranscript,
  ImageAnalysis,
  OCRResult,
  ApplianceInfo,
  MultimodalContext,
  MultimodalValidationResult
} from './types';

// ─── Voice Validator ──────────────────────────────────────────

export function validateVoiceTranscript(data: any): MultimodalValidationResult<VoiceTranscript> {
  const errors: string[] = [];
  if (!data || typeof data !== 'object') return { valid: false, errors: ['Invalid object.'] };

  if (typeof data.text !== 'string') errors.push("Missing 'text'.");
  if (typeof data.detectedLanguage !== 'string') errors.push("Missing 'detectedLanguage'.");
  if (typeof data.translatedText !== 'string') errors.push("Missing 'translatedText'.");
  if (typeof data.confidence !== 'number') errors.push("Missing 'confidence'.");

  if (errors.length > 0) return { valid: false, errors };
  return { valid: true, result: data as VoiceTranscript };
}

// ─── Image Validator ──────────────────────────────────────────

export function validateImageAnalysis(data: any): MultimodalValidationResult<ImageAnalysis> {
  const errors: string[] = [];
  if (!data || typeof data !== 'object') return { valid: false, errors: ['Invalid object.'] };

  if (typeof data.applianceType !== 'string') errors.push("Missing 'applianceType'.");
  if (typeof data.brand !== 'string') errors.push("Missing 'brand'.");
  if (!Array.isArray(data.visibleDefects)) errors.push("'visibleDefects' must be an array.");
  if (typeof data.damageSeverity !== 'string') errors.push("Missing 'damageSeverity'.");
  if (typeof data.confidence !== 'number') errors.push("Missing 'confidence'.");

  if (errors.length > 0) return { valid: false, errors };
  return { valid: true, result: data as ImageAnalysis };
}

// ─── OCR Validator ────────────────────────────────────────────

export function validateOCRResult(data: any): MultimodalValidationResult<OCRResult> {
  const errors: string[] = [];
  if (!data || typeof data !== 'object') return { valid: false, errors: ['Invalid object.'] };

  if (typeof data.rawText !== 'string') errors.push("Missing 'rawText'.");
  if (typeof data.documentType !== 'string') errors.push("Missing 'documentType'.");
  if (typeof data.extractedFields !== 'object') errors.push("'extractedFields' must be an object.");
  if (typeof data.confidence !== 'number') errors.push("Missing 'confidence'.");

  if (errors.length > 0) return { valid: false, errors };
  return { valid: true, result: data as OCRResult };
}

// ─── Appliance Info Validator ─────────────────────────────────

export function validateApplianceInfo(data: any): MultimodalValidationResult<ApplianceInfo> {
  const errors: string[] = [];
  if (!data || typeof data !== 'object') return { valid: false, errors: ['Invalid object.'] };

  if (typeof data.brand !== 'string') errors.push("Missing 'brand'.");
  if (typeof data.type !== 'string') errors.push("Missing 'type'.");
  if (typeof data.model !== 'string') errors.push("Missing 'model'.");
  if (typeof data.serialNumber !== 'string') errors.push("Missing 'serialNumber'.");
  if (typeof data.warrantyStatus !== 'string') errors.push("Missing 'warrantyStatus'.");

  if (errors.length > 0) return { valid: false, errors };
  return { valid: true, result: data as ApplianceInfo };
}

// ─── Multimodal Context Validator ─────────────────────────────

export function validateMultimodalContext(data: any): MultimodalValidationResult<MultimodalContext> {
  const errors: string[] = [];
  if (!data || typeof data !== 'object') return { valid: false, errors: ['Invalid object.'] };

  if (typeof data.problemSummary !== 'string') errors.push("Missing 'problemSummary'.");
  if (typeof data.language !== 'string') errors.push("Missing 'language'.");
  if (typeof data.confidence !== 'number') errors.push("Missing 'confidence'.");

  if (errors.length > 0) return { valid: false, errors };
  return { valid: true, result: data as MultimodalContext };
}
