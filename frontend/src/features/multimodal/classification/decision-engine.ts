/**
 * FixNow AI Workflow 5 — Decision Engine
 *
 * Combines scores from Vision, OCR, and Layout detectors to produce
 * a final weighted classification. Enforces a >90% confidence threshold.
 */

import { DetectorScore, ClassificationResult, UploadCategory } from './types';

export class DecisionEngine {
  /**
   * Weights the detector scores to determine the final category.
   * Weighting strategy:
   * - Vision has high weight for Appliance Issue.
   * - OCR has high weight for Documents.
   * - Layout serves as a tie-breaker/confidence booster for Documents.
   */
  evaluate(vision: DetectorScore, ocr: DetectorScore, layout: DetectorScore): ClassificationResult {
    // 1. Group scores by category
    const categoryScores: Record<string, number> = {};
    
    // Simple weighting (can be tuned):
    // Vision: 40%, OCR: 40%, Layout: 20%
    this.addScore(categoryScores, vision.predictedCategory, vision.score * 0.4);
    this.addScore(categoryScores, ocr.predictedCategory, ocr.score * 0.4);
    this.addScore(categoryScores, layout.predictedCategory, layout.score * 0.2);

    // 2. Find highest scoring category
    let bestCategory: UploadCategory = 'Unknown';
    let bestScore = 0;

    for (const [category, score] of Object.entries(categoryScores)) {
      if (score > bestScore) {
        bestScore = score;
        bestCategory = category as UploadCategory;
      }
    }

    // Handle "Mixed Images" detection explicitly:
    // If one strong signal says Appliance Issue and another strong signal says Warranty Card,
    // we should classify as Mixed Images.
    const hasStrongAppliance = 
      (vision.predictedCategory === 'Appliance Issue' && vision.score > 0.8) ||
      (ocr.predictedCategory === 'Appliance Issue' && ocr.score > 0.8);
      
    const hasStrongDocument = 
      (vision.predictedCategory !== 'Appliance Issue' && vision.predictedCategory !== 'Unknown' && vision.score > 0.8) ||
      (ocr.predictedCategory !== 'Appliance Issue' && ocr.predictedCategory !== 'Unknown' && ocr.score > 0.8);

    if (hasStrongAppliance && hasStrongDocument) {
      bestCategory = 'Mixed Images';
      bestScore = Math.max(bestScore, 0.95); // High confidence in mixed upload
    }

    // 3. Enforce the strict 90% threshold
    if (bestScore < 0.90) {
      bestCategory = 'Unknown';
    }

    return {
      finalCategory: bestCategory,
      combinedScore: bestScore,
      details: { vision, ocr, layout }
    };
  }

  private addScore(scores: Record<string, number>, category: UploadCategory, weightedScore: number) {
    if (category === 'Unknown') return;
    scores[category] = (scores[category] || 0) + weightedScore;
  }
}
