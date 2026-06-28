/**
 * FixNow AI Workflow 5 — OCR Detector
 *
 * Analyzes the text extracted from an image to determine
 * if it is a document or an appliance issue.
 */

import { FixNowAIService } from '@/lib/ai/service/fixnow-ai.service';
import { DetectorScore, UploadCategory } from '../types';

const OCR_PROMPT = `You are an OCR Text Detector for an image classification pipeline.
Analyze the provided text.

If you find dense text and keywords like:
- Warranty, Guarantee, Invoice, GST, IMEI, Purchase Date, Dealer, Customer Name, AMC
  -> It's a Warranty Card, Invoice/Bill, or Service Receipt.

If you find sparse or no text, or random branding text on an object:
- "compressor", "LG", "smart inverter", "water"
  -> It's an Appliance Issue.

RULES:
- "predictedCategory" must be one of: "Appliance Issue", "Warranty Card", "Invoice/Bill", "Service Receipt", "Mixed Images", "Unknown".
- "score" is your confidence (0.0 to 1.0). High score for lots of matching document keywords.
- "evidence" is a list of keywords or text patterns you found.

Output ONLY valid JSON.`;

export class OCRDetector {
  private aiService: FixNowAIService;

  constructor(aiService: FixNowAIService) {
    this.aiService = aiService;
  }

  async detect(ocrText: string, userId?: string): Promise<DetectorScore> {
    const raw = await this.aiService.analyze<any>(
      [
        { role: 'system', content: OCR_PROMPT },
        { role: 'user', content: `OCR Text:\n${ocrText}` }
      ],
      'technician',
      userId || 'anonymous'
    );

    if (!raw) {
      return { score: 0.1, predictedCategory: 'Unknown', evidence: ['Failed to analyze text'] };
    }

    return {
      score: typeof raw.score === 'number' ? raw.score : 0.5,
      predictedCategory: (raw.predictedCategory as UploadCategory) || 'Unknown',
      evidence: Array.isArray(raw.evidence) ? raw.evidence : []
    };
  }
}
