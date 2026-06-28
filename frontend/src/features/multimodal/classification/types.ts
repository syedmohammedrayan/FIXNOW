/**
 * FixNow AI Workflow 5 — Classification Pipeline Types
 */

export type UploadCategory =
  | 'Appliance Issue'
  | 'Warranty Card'
  | 'Invoice/Bill'
  | 'Service Receipt'
  | 'Mixed Images'
  | 'Unknown';

export interface DetectorScore {
  /** The confidence score from this specific detector (0.0 - 1.0) */
  score: number;
  /** What the detector thinks the image is */
  predictedCategory: UploadCategory;
  /** Reasons for this score */
  evidence: string[];
}

export interface ClassificationResult {
  /** The final combined category */
  finalCategory: UploadCategory;
  /** The final weighted confidence score (0.0 - 1.0) */
  combinedScore: number;
  /** Individual detector scores */
  details: {
    vision: DetectorScore;
    ocr: DetectorScore;
    layout: DetectorScore;
  };
}

export interface CrossVerificationResult {
  isMatch: boolean;
  message: string;
}
