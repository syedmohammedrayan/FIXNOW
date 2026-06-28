export type FeatureFlag =
  | 'VOICE_ENABLED'
  | 'OCR_ENABLED'
  | 'PREDICTIVE_ENABLED'
  | 'ADMIN_AI_ENABLED'
  | 'TECHNICIAN_COPILOT_ENABLED';

export const DEFAULT_FLAGS: Record<FeatureFlag, boolean> = {
  VOICE_ENABLED: true,
  OCR_ENABLED: true,
  PREDICTIVE_ENABLED: true,
  ADMIN_AI_ENABLED: true,
  TECHNICIAN_COPILOT_ENABLED: true
};
