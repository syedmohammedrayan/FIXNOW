/**
 * FixNow AI Workflow 5 — Document OCR Extraction
 *
 * Extracts raw text from warranty cards, invoices, service receipts,
 * and appliance labels (represented as text descriptions for now,
 * but ready for actual OCR API integration).
 */

import { FixNowAIService } from '@/lib/ai/service/fixnow-ai.service';
import { OCRResult, DocumentType } from '../types';

const OCR_PROMPT = `You are a Document OCR extraction assistant.
Given a raw dump of text scanned from a document, you must:
1. Identify the document type (warranty_card, invoice, service_receipt, appliance_label, user_manual).
2. Extract all relevant key-value pairs (brand, model, serial number, purchase date, warranty period, etc.).

RULES:
- "rawText" should be the cleaned up version of the input text.
- "documentType" must be one of the defined categories.
- "extractedFields" should be a flat object of string keys to string values.
- "confidence" reflects how well the document could be parsed (0.0 - 1.0).

Output ONLY valid JSON matching the OCRResult schema.`;

export class DocumentOCRService {
  private aiService: FixNowAIService;

  constructor(aiService: FixNowAIService) {
    this.aiService = aiService;
  }

  /**
   * Processes raw text (simulating OCR output) and structures it.
   */
  async extractText(rawDocumentText: string, userId?: string): Promise<OCRResult> {
    const raw = await this.aiService.analyze<any>(
      [
        { role: 'system', content: OCR_PROMPT },
        { role: 'user', content: `Raw OCR Input:\n\n${rawDocumentText}` }
      ],
      'customer',
      userId || 'anonymous'
    );

    if (!raw) {
      throw new Error('DocumentOCRService: AI returned null.');
    }

    return {
      rawText: raw.rawText || rawDocumentText,
      documentType: (raw.documentType as DocumentType) || 'unknown',
      extractedFields: typeof raw.extractedFields === 'object' ? raw.extractedFields : {},
      confidence: typeof raw.confidence === 'number' ? raw.confidence : 0.5
    };
  }
}
