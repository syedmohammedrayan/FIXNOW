/**
 * FixNow AI Diagnosis Engine — Parser
 *
 * Extracts and normalizes DiagnosisResult from raw AI text.
 * Domain-specific parsing logic separate from the platform ResponseParser.
 */

import type { DiagnosisResult, UrgencyLevel, TechnicianCategory } from './types';

// ─── Valid Values ─────────────────────────────────────────────

const VALID_URGENCY: UrgencyLevel[] = ['Critical', 'High', 'Medium', 'Low'];

const VALID_TECHNICIAN_TYPES: TechnicianCategory[] = [
  'Electrical', 'Plumbing', 'HVAC', 'Carpentry',
  'Cleaning', 'Painting', 'Appliance Repair', 'General'
];

// ─── Parser Class ─────────────────────────────────────────────

export class DiagnosisParser {
  /**
   * Attempts to extract a DiagnosisResult from raw AI text.
   * Handles markdown wrapping, trailing prose, and multiple JSON blocks.
   * Returns null if extraction fails entirely.
   */
  parse(rawText: string): DiagnosisResult | null {
    if (!rawText || typeof rawText !== 'string') return null;

    const jsonObject = this.extractJson(rawText);
    if (!jsonObject) return null;

    return this.normalize(jsonObject);
  }

  /**
   * Extract the first valid JSON object from raw text.
   */
  private extractJson(text: string): Record<string, unknown> | null {
    let cleaned = text.trim();

    // Strategy 1: Strip markdown code blocks (```json ... ```)
    const codeBlockMatch = cleaned.match(/```(?:json)?\s*\n?([\s\S]*?)```/);
    if (codeBlockMatch) {
      cleaned = codeBlockMatch[1].trim();
    }

    // Strategy 2: Find the first { ... } block
    const braceStart = cleaned.indexOf('{');
    const braceEnd = cleaned.lastIndexOf('}');
    if (braceStart !== -1 && braceEnd > braceStart) {
      cleaned = cleaned.substring(braceStart, braceEnd + 1);
    }

    try {
      const parsed = JSON.parse(cleaned);
      if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
        return parsed;
      }
    } catch {
      // JSON parse failed
    }

    // Strategy 3: Try line-by-line extraction for mangled responses
    const lines = text.split('\n');
    let jsonCandidate = '';
    let depth = 0;
    let started = false;

    for (const line of lines) {
      for (const char of line) {
        if (char === '{') { depth++; started = true; }
        if (started) jsonCandidate += char;
        if (char === '}') { depth--; }
        if (started && depth === 0) {
          try {
            const parsed = JSON.parse(jsonCandidate);
            if (typeof parsed === 'object' && parsed !== null) return parsed;
          } catch {
            jsonCandidate = '';
            started = false;
          }
        }
      }
      if (started) jsonCandidate += '\n';
    }

    return null;
  }

  /**
   * Normalize raw parsed JSON into a well-formed DiagnosisResult.
   * Coerces types and clamps values to valid ranges.
   */
  private normalize(raw: Record<string, unknown>): DiagnosisResult | null {
    try {
      const result: DiagnosisResult = {
        problem: this.normalizeString(raw.problem, ''),
        confidence: this.normalizeConfidence(raw.confidence),
        urgency: this.normalizeUrgency(raw.urgency),
        estimatedRepair: this.normalizeString(raw.estimatedRepair, ''),
        estimatedCost: this.normalizeString(raw.estimatedCost || raw.estimated_cost, ''),
        estimatedTime: this.normalizeString(raw.estimatedTime || raw.estimated_time, ''),
        recommendedTechnicianType: this.normalizeTechnicianType(
          raw.recommendedTechnicianType || raw.recommended_technician_type
        ),
        safetyAdvice: this.normalizeString(raw.safetyAdvice || raw.safety_advice, ''),
        suggestedNextAction: this.normalizeString(raw.suggestedNextAction || raw.suggested_next_action, ''),
        needsEmergencyVisit: this.normalizeBoolean(raw.needsEmergencyVisit ?? raw.needs_emergency_visit),
      };

      return result;
    } catch {
      return null;
    }
  }

  // ─── Normalization Helpers ────────────────────────────────

  private normalizeString(value: unknown, fallback: string): string {
    if (typeof value === 'string') return value.trim();
    if (typeof value === 'number') return String(value);
    return fallback;
  }

  private normalizeConfidence(value: unknown): number {
    if (typeof value === 'number') {
      // Clamp to 0–1
      return Math.max(0, Math.min(1, value));
    }
    if (typeof value === 'string') {
      const parsed = parseFloat(value);
      if (!isNaN(parsed)) return Math.max(0, Math.min(1, parsed));
    }
    return 0.5; // Default to medium confidence
  }

  private normalizeUrgency(value: unknown): UrgencyLevel {
    if (typeof value === 'string') {
      // Case-insensitive match
      const match = VALID_URGENCY.find(
        u => u.toLowerCase() === value.trim().toLowerCase()
      );
      if (match) return match;
    }
    return 'Medium'; // Safe default
  }

  private normalizeTechnicianType(value: unknown): TechnicianCategory {
    if (typeof value === 'string') {
      const trimmed = value.trim().toLowerCase();
      const match = VALID_TECHNICIAN_TYPES.find(
        t => t.toLowerCase() === trimmed
      );
      if (match) return match;

      // Handle common AI variations
      if (trimmed.includes('electric')) return 'Electrical';
      if (trimmed.includes('plumb')) return 'Plumbing';
      if (trimmed.includes('hvac') || trimmed.includes('air condition') || trimmed.includes('ac ')) return 'HVAC';
      if (trimmed.includes('carpen') || trimmed.includes('wood')) return 'Carpentry';
      if (trimmed.includes('clean')) return 'Cleaning';
      if (trimmed.includes('paint')) return 'Painting';
      if (trimmed.includes('appliance')) return 'Appliance Repair';
    }
    return 'General';
  }

  private normalizeBoolean(value: unknown): boolean {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'string') return value.toLowerCase() === 'true';
    return false;
  }
}

export const diagnosisParser = new DiagnosisParser();
