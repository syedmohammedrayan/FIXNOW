/**
 * FixNow AI Workflow 5 — Document Parser
 *
 * Converts structured OCR data into standard ApplianceInfo.
 */

import { FixNowAIService } from '@/lib/ai/service/fixnow-ai.service';
import { OCRResult, ApplianceInfo, WarrantyStatus } from '../types';

const DOCUMENT_PARSER_PROMPT = `You are a data standardization expert.
Given extracted fields from a document (like a warranty card or invoice), parse them into a standard ApplianceInfo structure.

RULES:
- "brand": The manufacturer name (e.g., "LG", "Samsung"). Or "Unknown".
- "type": The appliance type (e.g., "AC", "Washing Machine"). Or "Unknown".
- "model": Model number/name. Or "Unknown".
- "serialNumber": The exact serial string. Or "Unknown".
- "warrantyStatus": One of "Valid", "Expired", "Unknown". Calculate based on purchase date and warranty period if current date is 2026.
- "warrantyExpiry": ISO date string if possible, or "Unknown".

Output ONLY valid JSON matching the ApplianceInfo schema.`;

export class DocumentParserService {
  private aiService: FixNowAIService;

  constructor(aiService: FixNowAIService) {
    this.aiService = aiService;
  }

  /**
   * Parses extracted OCR fields into structured appliance information.
   */
  async parseApplianceInfo(ocrResult: OCRResult, userId?: string): Promise<ApplianceInfo> {
    const raw = await this.aiService.analyze<any>(
      [
        { role: 'system', content: DOCUMENT_PARSER_PROMPT },
        { role: 'user', content: `Document Fields:\n${JSON.stringify(ocrResult.extractedFields, null, 2)}` }
      ],
      'customer',
      userId || 'anonymous'
    );

    if (!raw) {
      throw new Error('DocumentParser: AI returned null.');
    }

    return {
      brand: raw.brand || 'Unknown',
      type: raw.type || 'Unknown',
      model: raw.model || 'Unknown',
      serialNumber: raw.serialNumber || 'Unknown',
      warrantyStatus: (raw.warrantyStatus as WarrantyStatus) || 'Unknown',
      warrantyExpiry: raw.warrantyExpiry || 'Unknown'
    };
  }
}
