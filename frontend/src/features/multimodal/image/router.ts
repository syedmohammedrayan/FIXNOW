/**
 * FixNow AI Workflow 5 — Smart Image Router
 *
 * Analyzes an image description to determine if the user uploaded
 * a photo of an appliance (for fault diagnosis) or a document
 * (for warranty intelligence).
 */

import { FixNowAIService } from '@/lib/ai/service/fixnow-ai.service';

const ROUTER_PROMPT = `You are a Smart Image Router for a field service platform.
Given an image description, determine if the user uploaded a picture of a physical appliance (likely showing damage or a fault) or a picture of a document (invoice, warranty card, receipt, bill).

RULES:
- Output ONLY valid JSON.
- "category" must be either "ApplianceIssue" or "Document".
- "confidence" is your certainty level (0.0 to 1.0).

Output:
{
  "category": "ApplianceIssue|Document",
  "confidence": 0.95
}`;

export type ImageRouteCategory = 'ApplianceIssue' | 'Document';

export interface ImageRouteResult {
  category: ImageRouteCategory;
  confidence: number;
}

export class ImageRouterService {
  private aiService: FixNowAIService;

  constructor(aiService: FixNowAIService) {
    this.aiService = aiService;
  }

  async routeImage(imageDescription: string, userId?: string): Promise<ImageRouteResult> {
    const raw = await this.aiService.analyze<any>(
      [
        { role: 'system', content: ROUTER_PROMPT },
        { role: 'user', content: `Route this image description: "${imageDescription}"` }
      ],
      'customer',
      userId || 'anonymous'
    );

    if (!raw) {
      // Default to appliance issue to maintain backward compatibility
      return { category: 'ApplianceIssue', confidence: 0.1 };
    }

    return {
      category: (raw.category as ImageRouteCategory) || 'ApplianceIssue',
      confidence: typeof raw.confidence === 'number' ? raw.confidence : 0.5
    };
  }
}
