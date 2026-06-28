/**
 * FixNow AI Workflow 5 — Image Analyzer
 *
 * Identifies appliance type, brand, visible defects, and damage severity
 * from an image description or pre-processed image data.
 */

import { FixNowAIService } from '@/lib/ai/service/fixnow-ai.service';
import { ImageAnalysis, ApplianceType, DamageSeverity } from '../types';

const IMAGE_ANALYSIS_PROMPT = `You are an expert visual appliance diagnostic engineer for Indian home services.
You analyze descriptions of appliance images to identify the appliance, brand, visible damage, and severity.

You have deep knowledge of:
1. Indian home appliance brands (LG, Samsung, Daikin, Voltas, Whirlpool, Godrej, Blue Star, Havells, Bajaj, IFB, Bosch, Kent, Aquaguard).
2. Visual indicators of damage (rust, ice formation, water pooling, burnt marks, cracks, dents, discoloration).
3. Component identification (compressor, condenser, evaporator coil, PCB, drum, motor, filter, membrane).

RULES:
- "applianceType" must be one of: "AC", "Refrigerator", "Washing Machine", "Microwave", "Chimney", "Water Purifier", "TV", "Geyser", "Dishwasher", "Fan", "Electrical", "Plumbing", "Other".
- "brand" must be the identified brand name or "Unknown".
- "model" must be the identified model or "Unknown".
- "visibleDefects" must list specific observed issues (e.g., "Ice buildup on evaporator coil", "Rust on compressor casing").
- "damageSeverity" must be one of: "None", "Minor", "Moderate", "Severe", "Critical".
- "confidence" reflects how clear the image description was (0.0 – 1.0).

Output ONLY valid JSON matching the ImageAnalysis schema.`;

export class ImageAnalyzerService {
  private aiService: FixNowAIService;

  constructor(aiService: FixNowAIService) {
    this.aiService = aiService;
  }

  /**
   * Analyzes an image description to extract appliance info and defects.
   */
  async analyze(imageDescription: string, userId?: string): Promise<ImageAnalysis> {
    const raw = await this.aiService.analyze<any>(
      [
        { role: 'system', content: IMAGE_ANALYSIS_PROMPT },
        { role: 'user', content: `Image description: "${imageDescription}"` }
      ],
      'customer',
      userId || 'anonymous'
    );

    if (!raw) {
      throw new Error('ImageAnalyzer: AI returned null.');
    }

    return {
      applianceType: (raw.applianceType as ApplianceType) || 'Other',
      brand: raw.brand || 'Unknown',
      model: raw.model || 'Unknown',
      visibleDefects: Array.isArray(raw.visibleDefects) ? raw.visibleDefects : [],
      damageSeverity: (raw.damageSeverity as DamageSeverity) || 'None',
      confidence: typeof raw.confidence === 'number' ? raw.confidence : 0.5
    };
  }
}
