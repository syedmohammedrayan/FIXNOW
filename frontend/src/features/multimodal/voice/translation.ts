/**
 * FixNow AI Workflow 5 — Voice Translation
 *
 * Translates any detected Indian language to the platform's internal
 * working language (English) while preserving original language metadata.
 */

import { FixNowAIService } from '@/lib/ai/service/fixnow-ai.service';
import { SupportedLanguage } from '../types';

const TRANSLATION_PROMPT = `You are a professional translator specializing in Indian languages for a home services platform.

Translate the following text to English. Preserve technical terms (appliance names, part names) accurately.
If the text contains service-related slang or colloquial descriptions, translate the intent rather than literal words.

RULES:
- Output ONLY valid JSON.
- "translatedText" must be fluent, natural English.
- "originalLanguage" must identify the source language.
- "confidence" reflects translation accuracy (0.0 – 1.0).
- Preserve brand names (LG, Samsung, Daikin, etc.) unchanged.

Output:
{
  "translatedText": "...",
  "originalLanguage": "Hindi|Tamil|Telugu|...",
  "confidence": 0.95
}`;

export interface TranslationResult {
  translatedText: string;
  originalLanguage: SupportedLanguage;
  confidence: number;
}

export class VoiceTranslationService {
  private aiService: FixNowAIService;

  constructor(aiService: FixNowAIService) {
    this.aiService = aiService;
  }

  /**
   * Translates text from any Indian language to English.
   */
  async translate(text: string, userId?: string): Promise<TranslationResult> {
    const raw = await this.aiService.analyze<any>(
      [
        { role: 'system', content: TRANSLATION_PROMPT },
        { role: 'user', content: `Translate: "${text}"` }
      ],
      'customer',
      userId || 'anonymous'
    );

    if (!raw) {
      // If AI fails, return the original text as-is
      return {
        translatedText: text,
        originalLanguage: 'Other',
        confidence: 0.1
      };
    }

    return {
      translatedText: raw.translatedText || text,
      originalLanguage: (raw.originalLanguage as SupportedLanguage) || 'Other',
      confidence: typeof raw.confidence === 'number' ? raw.confidence : 0.5
    };
  }
}
