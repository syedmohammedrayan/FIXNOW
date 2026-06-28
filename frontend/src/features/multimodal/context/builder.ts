/**
 * FixNow AI Workflow 5 — Multimodal Context Builder
 *
 * Merges voice, image, OCR, and text inputs into a single, unified MultimodalContext.
 */

import { FixNowAIService } from '@/lib/ai/service/fixnow-ai.service';
import { VoiceTranscript, ImageAnalysis, OCRResult, ApplianceInfo, MultimodalContext, SupportedLanguage } from '../types';

const CONTEXT_BUILDER_PROMPT = `You are the master integration engine for a multimodal field service platform.
You receive inputs from multiple modalities: Voice, Image, Document (OCR), and raw Text.

Your job is to synthesize these into a single, unified problem summary and determine the overall language.

RULES:
- "problemSummary" must be a concise, comprehensive English summary of the issue, combining facts from all available inputs.
- "language" should be the primary language detected across all inputs (prefer Voice language if available, else English).
- "confidence" reflects how well the inputs align with each other (e.g., if Image shows a fridge but Voice says "AC is broken", confidence is low).

Output ONLY valid JSON matching:
{
  "problemSummary": "...",
  "language": "English|Hindi|...",
  "confidence": 0.95
}`;

export class MultimodalContextBuilder {
  private aiService: FixNowAIService;

  constructor(aiService: FixNowAIService) {
    this.aiService = aiService;
  }

  /**
   * Merges all individual modality outputs into a unified context.
   */
  async buildContext(
    inputs: {
      voice?: VoiceTranscript;
      image?: ImageAnalysis;
      document?: OCRResult;
      appliance?: ApplianceInfo;
      text?: string;
    },
    userId?: string
  ): Promise<MultimodalContext> {
    const payload = JSON.stringify(inputs, null, 2);

    const raw = await this.aiService.analyze<any>(
      [
        { role: 'system', content: CONTEXT_BUILDER_PROMPT },
        { role: 'user', content: `Multimodal Inputs:\n${payload}` }
      ],
      'customer',
      userId || 'anonymous'
    );

    if (!raw) {
      throw new Error('ContextBuilder: AI returned null.');
    }

    return {
      voice: inputs.voice,
      image: inputs.image,
      document: inputs.document,
      appliance: inputs.appliance,
      userText: inputs.text,
      problemSummary: raw.problemSummary || inputs.text || 'Unknown problem.',
      language: (raw.language as SupportedLanguage) || 'English',
      confidence: typeof raw.confidence === 'number' ? raw.confidence : 0.5
    };
  }
}
