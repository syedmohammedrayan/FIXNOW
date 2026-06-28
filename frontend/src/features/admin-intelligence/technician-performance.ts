/**
 * FixNow AI Workflow 6 — Technician Performance Analyzer
 *
 * Analyzes technician quality using Hindsight reflect for
 * longitudinal pattern recognition across repair history.
 */

import { FixNowAIService } from '@/lib/ai/service/fixnow-ai.service';
import { TechnicianPerformanceInsight } from './types';
import { TECHNICIAN_PERFORMANCE_PROMPT } from './prompts';
import { validateTechnicianPerformance } from './validator';

export class TechnicianPerformanceEngine {
  private aiService: FixNowAIService;

  constructor(aiService: FixNowAIService) {
    this.aiService = aiService;
  }

  /**
   * Analyzes a technician's historical performance data.
   * Leverages Hindsight reflect (via FixNowAIService) for deeper pattern analysis.
   */
  async analyze(technicianData: string, userId?: string): Promise<TechnicianPerformanceInsight> {
    const raw = await this.aiService.analyze<any>(
      [
        { role: 'system', content: TECHNICIAN_PERFORMANCE_PROMPT },
        { role: 'user', content: `Technician Data:\n${technicianData}` }
      ],
      'technician',
      userId || 'admin'
    );

    if (!raw) throw new Error('TechnicianPerformanceEngine: AI returned null.');

    const validation = validateTechnicianPerformance(raw);
    if (!validation.valid || !validation.result) {
      console.warn('TechnicianPerformance validation failed:', validation.errors);
      return {
        technicianId: 'unknown', technicianName: 'Unknown',
        rating: 'Average', successRate: 0.5, avgCompletionMinutes: 0,
        repeatFailureRate: 0, customerFeedbackScore: 3, escalationCount: 0,
        recommendations: ['Insufficient data for analysis.']
      };
    }

    return validation.result;
  }
}
