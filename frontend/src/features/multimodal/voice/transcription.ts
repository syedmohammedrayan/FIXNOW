/**
 * FixNow AI Workflow 5 — Voice Transcription
 *
 * Converts speech descriptions to structured text with language detection.
 * Supports all major Indian languages.
 */

import { FixNowAIService } from '@/lib/ai/service/fixnow-ai.service';
import { VoiceTranscript, SupportedLanguage } from '../types';

const TRANSCRIPTION_PROMPT = `You are an expert multilingual speech-to-text analyst for an Indian home services platform.
You receive a text representation of a customer's voice message (which may have been pre-transcribed by a speech API or described as text).

Your job is to:
1. Identify the spoken language precisely (Hindi, Tamil, Telugu, Kannada, Malayalam, Bengali, Gujarati, Marathi, Punjabi, Odia, Urdu, Assamese, or English).
2. Clean and normalize the transcription (fix obvious speech-to-text errors, remove filler words).
3. Translate the content to English if it's not already in English.
4. Identify the core service problem being described.

RULES:
- "text" must be the cleaned original-language transcription.
- "detectedLanguage" must be one of the supported languages.
- "translatedText" must be the English translation (same as text if already English).
- "confidence" reflects transcription + translation quality (0.0 – 1.0).

Output ONLY valid JSON:
{
  "text": "original language cleaned text",
  "detectedLanguage": "Hindi|Tamil|Telugu|...",
  "translatedText": "English translation",
  "confidence": 0.95
}`;

export class VoiceTranscriptionService {
  private aiService: FixNowAIService;

  constructor(aiService: FixNowAIService) {
    this.aiService = aiService;
  }

  /**
   * Processes a voice input (text representation of speech) and returns
   * a structured transcript with language detection and English translation.
   */
  async transcribe(audioDescription: string, userId?: string): Promise<VoiceTranscript> {
    const raw = await this.aiService.analyze<any>(
      [
        { role: 'system', content: TRANSCRIPTION_PROMPT },
        { role: 'user', content: `Voice input: "${audioDescription}"` }
      ],
      'customer',
      userId || 'anonymous'
    );

    if (!raw) {
      throw new Error('VoiceTranscription: AI returned null.');
    }

    return {
      text: raw.text || audioDescription,
      detectedLanguage: (raw.detectedLanguage as SupportedLanguage) || 'Other',
      translatedText: raw.translatedText || audioDescription,
      confidence: typeof raw.confidence === 'number' ? raw.confidence : 0.5
    };
  }
}
