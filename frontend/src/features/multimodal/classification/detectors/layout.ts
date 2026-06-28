/**
 * FixNow AI Workflow 5 — Layout Detector
 *
 * Analyzes structural layout information of the image to determine
 * if it is a document.
 */

import { FixNowAIService } from '@/lib/ai/service/fixnow-ai.service';
import { DetectorScore, UploadCategory } from '../types';

const LAYOUT_PROMPT = `You are a Layout Detector for an image classification pipeline.
Analyze the provided description of the image's layout and structure.

If you find:
- Aligned text, tables, borders, formal headers/footers, stamps
  -> It's a Document (Warranty Card, Invoice/Bill, Service Receipt).

If you find:
- Natural scene layout, 3D object depth, unstructured visual components
  -> It's an Appliance Issue.

RULES:
- "predictedCategory" must be one of: "Appliance Issue", "Warranty Card", "Invoice/Bill", "Service Receipt", "Mixed Images", "Unknown".
- "score" is your confidence (0.0 to 1.0).
- "evidence" is a list of layout traits you found.

Output ONLY valid JSON.`;

export class LayoutDetector {
  private aiService: FixNowAIService;

  constructor(aiService: FixNowAIService) {
    this.aiService = aiService;
  }

  async detect(layoutDescription: string, userId?: string): Promise<DetectorScore> {
    const raw = await this.aiService.analyze<any>(
      [
        { role: 'system', content: LAYOUT_PROMPT },
        { role: 'user', content: `Layout Description:\n${layoutDescription}` }
      ],
      'technician',
      userId || 'anonymous'
    );

    if (!raw) {
      return { score: 0.1, predictedCategory: 'Unknown', evidence: ['Failed to analyze layout'] };
    }

    return {
      score: typeof raw.score === 'number' ? raw.score : 0.5,
      predictedCategory: (raw.predictedCategory as UploadCategory) || 'Unknown',
      evidence: Array.isArray(raw.evidence) ? raw.evidence : []
    };
  }
}
