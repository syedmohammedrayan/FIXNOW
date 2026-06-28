/**
 * FixNow AI Workflow 5 — Warranty Extractor
 *
 * Deep OCR and NLP extraction tailored for Indian warranty cards,
 * invoices, and AMC certificates. Outputs the comprehensive WarrantyExtraction schema.
 */

import { FixNowAIService } from '@/lib/ai/service/fixnow-ai.service';
import { WarrantyExtraction } from './types';

const WARRANTY_EXTRACTOR_PROMPT = `You are an expert Document Intelligence agent for an Indian Field Service Platform.
You receive raw OCR text from a document. Your job is to extract highly structured warranty data.

RULES:
- Extract all fields strictly. If a field is not found, use an empty string "" (or 0 for numbers).
- "documentType": Must be one of "Warranty Card", "Invoice", "Guarantee Card", "AMC".
- "isFixNowWarranty": Set to true ONLY IF "FixNow" is mentioned as the provider or AMC partner.
- Dates should be converted to YYYY-MM-DD format if possible.
- "coverage" and "exclusions": List the specific parts or conditions mentioned.

Output ONLY valid JSON matching the WarrantyExtraction schema.`;

export class WarrantyExtractorService {
  private aiService: FixNowAIService;

  constructor(aiService: FixNowAIService) {
    this.aiService = aiService;
  }

  async extract(rawOcrText: string, userId?: string): Promise<WarrantyExtraction> {
    const raw = await this.aiService.analyze<any>(
      [
        { role: 'system', content: WARRANTY_EXTRACTOR_PROMPT },
        { role: 'user', content: `Raw OCR Text:\n\n${rawOcrText}` }
      ],
      'customer',
      userId || 'anonymous'
    );

    if (!raw) {
      throw new Error('WarrantyExtractor: AI returned null.');
    }

    return {
      documentType: raw.documentType || 'Warranty Card',
      confidence: typeof raw.confidence === 'number' ? raw.confidence : 0.5,
      brand: raw.brand || '',
      applianceType: raw.applianceType || '',
      modelNumber: raw.modelNumber || '',
      serialNumber: raw.serialNumber || '',
      customerName: raw.customerName || '',
      purchaseDate: raw.purchaseDate || '',
      warrantyStartDate: raw.warrantyStartDate || '',
      warrantyEndDate: raw.warrantyEndDate || '',
      warrantyProvider: raw.warrantyProvider || '',
      isFixNowWarranty: !!raw.isFixNowWarranty,
      coverage: Array.isArray(raw.coverage) ? raw.coverage : [],
      exclusions: Array.isArray(raw.exclusions) ? raw.exclusions : [],
      freeServicesRemaining: typeof raw.freeServicesRemaining === 'number' ? raw.freeServicesRemaining : 0,
      invoiceNumber: raw.invoiceNumber || '',
      retailer: raw.retailer || '',
      ocrText: rawOcrText
    };
  }
}
