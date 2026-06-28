/**
 * FixNow AI Workflow 5 — Image Classifier
 *
 * Classifies images into specific appliance categories for routing
 * to the correct technician specialization.
 */

import { FixNowAIService } from '@/lib/ai/service/fixnow-ai.service';
import { ApplianceType } from '../types';

const CLASSIFIER_PROMPT = `You are an appliance classification expert.
Given an image description, classify the appliance into exactly one category.

Categories:
- "AC": Split AC, Window AC, Cassette AC, Tower AC, Central AC
- "Refrigerator": Single/Double/Triple door fridge, Side-by-side, French door, Deep freezer
- "Washing Machine": Front load, Top load, Semi-automatic, Washer-dryer
- "Microwave": Solo, Grill, Convection, OTG
- "Chimney": Kitchen chimney, exhaust hood
- "Water Purifier": RO, UV, UF systems
- "TV": LED, LCD, Smart TV, OLED
- "Geyser": Storage, Instant, Solar water heater
- "Dishwasher": Built-in, Freestanding
- "Fan": Ceiling, Exhaust, Pedestal, Tower
- "Electrical": Wiring, Switchboard, MCB panel, Inverter
- "Plumbing": Pipes, Taps, Toilet, Basin
- "Other": Anything not matching above

Output ONLY valid JSON:
{
  "applianceType": "AC|Refrigerator|...",
  "subType": "Split AC|Front Load|...",
  "confidence": 0.95
}`;

export interface ImageClassificationResult {
  applianceType: ApplianceType;
  subType: string;
  confidence: number;
}

export class ImageClassifierService {
  private aiService: FixNowAIService;

  constructor(aiService: FixNowAIService) {
    this.aiService = aiService;
  }

  /**
   * Classifies an image description into an appliance category.
   */
  async classify(imageDescription: string, userId?: string): Promise<ImageClassificationResult> {
    const raw = await this.aiService.analyze<any>(
      [
        { role: 'system', content: CLASSIFIER_PROMPT },
        { role: 'user', content: `Classify this appliance: "${imageDescription}"` }
      ],
      'customer',
      userId || 'anonymous'
    );

    if (!raw) {
      return { applianceType: 'Other', subType: 'Unknown', confidence: 0.1 };
    }

    return {
      applianceType: (raw.applianceType as ApplianceType) || 'Other',
      subType: raw.subType || 'Unknown',
      confidence: typeof raw.confidence === 'number' ? raw.confidence : 0.5
    };
  }
}
