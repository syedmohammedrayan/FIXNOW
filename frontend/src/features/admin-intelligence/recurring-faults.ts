/**
 * FixNow AI Workflow 6 — Recurring Faults Detector
 *
 * Detects repeated appliance fault patterns across the entire platform.
 */

import { FixNowAIService } from '@/lib/ai/service/fixnow-ai.service';
import { RecurringFaultInsight } from './types';
import { RECURRING_FAULTS_PROMPT } from './prompts';
import { validateRecurringFault } from './validator';

export class RecurringFaultsEngine {
  private aiService: FixNowAIService;

  constructor(aiService: FixNowAIService) {
    this.aiService = aiService;
  }

  /**
   * Analyzes platform-wide repair data to detect recurring fault patterns.
   */
  async detect(repairData: string, userId?: string): Promise<RecurringFaultInsight[]> {
    const raw = await this.aiService.analyze<any>(
      [
        { role: 'system', content: RECURRING_FAULTS_PROMPT },
        { role: 'user', content: `Platform Repair Data:\n${repairData}` }
      ],
      'technician',
      userId || 'admin'
    );

    if (!raw) throw new Error('RecurringFaultsEngine: AI returned null.');

    // The AI may return a single object or an array
    const items = Array.isArray(raw) ? raw : [raw];
    const validated: RecurringFaultInsight[] = [];

    for (const item of items) {
      const validation = validateRecurringFault(item);
      if (validation.valid && validation.result) {
        validated.push(validation.result);
      } else {
        console.warn('RecurringFault validation failed for item:', validation.errors);
      }
    }

    return validated;
  }
}
