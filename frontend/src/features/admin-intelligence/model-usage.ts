/**
 * FixNow AI Workflow 6 — Model Usage Analyzer
 *
 * Analyzes CascadeFlow runtime traces for model usage patterns,
 * cost trends, escalation frequency, and quality gate failures.
 */

import { FixNowAIService } from '@/lib/ai/service/fixnow-ai.service';
import { ModelUsageInsight } from './types';
import { MODEL_USAGE_PROMPT } from './prompts';
import { validateModelUsage } from './validator';

export class ModelUsageEngine {
  private aiService: FixNowAIService;

  constructor(aiService: FixNowAIService) {
    this.aiService = aiService;
  }

  /**
   * Analyzes CascadeFlow runtime traces to provide model usage insights.
   */
  async analyze(traceData: string, userId?: string): Promise<ModelUsageInsight> {
    const raw = await this.aiService.analyze<any>(
      [
        { role: 'system', content: MODEL_USAGE_PROMPT },
        { role: 'user', content: `CascadeFlow Trace Data:\n${traceData}` }
      ],
      'technician',
      userId || 'admin'
    );

    if (!raw) throw new Error('ModelUsageEngine: AI returned null.');

    const validation = validateModelUsage(raw);
    if (!validation.valid || !validation.result) {
      console.warn('ModelUsage validation failed:', validation.errors);
      return {
        period: 'Unknown', totalCalls: 0, modelBreakdown: [],
        escalationRate: 0, qualityGateFailureRate: 0,
        costRecommendations: ['Insufficient data for analysis.']
      };
    }

    return validation.result;
  }
}
