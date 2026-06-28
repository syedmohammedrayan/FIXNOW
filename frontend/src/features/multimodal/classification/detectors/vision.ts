/**
 * FixNow AI Workflow 5 — Vision Detector
 *
 * Analyzes the visual traits of an image (independent of text)
 * to determine if it is a physical appliance or a document.
 */

import { FixNowAIService } from '@/lib/ai/service/fixnow-ai.service';
import { DetectorScore, UploadCategory } from '../types';

const VISION_PROMPT = `You are a Vision Detector for an image classification pipeline.
Analyze the image description purely based on visual characteristics. Do not read the text.

If you see:
- Real-world objects, metallic surfaces, appliances (fridge, AC, washer), broken parts, rust, leaks, cracks
  -> Appliance Issue

If you see:
- A rectangular piece of paper, printed logos, barcodes, QR codes, signatures, white background
  -> Warranty Card or Invoice/Bill

If you see multiple distinct items (an appliance AND a paper document side-by-side):
  -> Mixed Images

RULES:
- "predictedCategory" must be one of: "Appliance Issue", "Warranty Card", "Invoice/Bill", "Service Receipt", "Mixed Images", "Unknown".
- "score" is your confidence (0.0 to 1.0).
- "evidence" is a list of visual traits you observed.

Output ONLY valid JSON:
{
  "predictedCategory": "Appliance Issue",
  "score": 0.92,
  "evidence": ["Metallic surface", "Visible rust on pipe"]
}`;

export class VisionDetector {
  private aiService: FixNowAIService;

  constructor(aiService: FixNowAIService) {
    this.aiService = aiService;
  }

  async detect(imageDescription: string, userId?: string): Promise<DetectorScore> {
    const raw = await this.aiService.analyze<any>(
      [
        { role: 'system', content: VISION_PROMPT },
        { role: 'user', content: `Visual Description:\n${imageDescription}` }
      ],
      'technician',
      userId || 'anonymous'
    );

    if (!raw) {
      return { score: 0.1, predictedCategory: 'Unknown', evidence: ['Failed to analyze'] };
    }

    return {
      score: typeof raw.score === 'number' ? raw.score : 0.5,
      predictedCategory: (raw.predictedCategory as UploadCategory) || 'Unknown',
      evidence: Array.isArray(raw.evidence) ? raw.evidence : []
    };
  }
}
