/**
 * FixNow AI Diagnosis Engine — Public Exports
 *
 * Clean barrel export for the diagnosis module.
 * Import from '@/features/diagnosis' in consuming code.
 */

export { DiagnosisService, diagnosisService } from './service';
export { diagnosisParser } from './parser';
export { diagnosisValidator } from './validator';
export type {
  DiagnosisRequest,
  DiagnosisResult,
  UrgencyLevel,
  TechnicianCategory,
  ValidationResult,
  ValidationSuccess,
  ValidationFailure,
} from './types';
