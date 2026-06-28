/**
 * FixNow AI Workflow 4 — Maintenance Planner
 *
 * Converts a MaintenanceRisk assessment into a concrete preventive MaintenancePlan
 * with scheduled actions, parts to inspect, and service intervals.
 */

import { FixNowAIService } from '@/lib/ai/service/fixnow-ai.service';
import { ApplianceProfile, MaintenanceRisk, MaintenancePlan } from './types';
import { MAINTENANCE_PLAN_PROMPT, buildMaintenancePlanPrompt } from './prompts';
import { validateMaintenancePlan } from './validator';

export class MaintenancePlanner {
  private aiService: FixNowAIService;

  constructor(aiService: FixNowAIService) {
    this.aiService = aiService;
  }

  /**
   * Generates a preventive maintenance plan based on the risk analysis.
   */
  async generateMaintenancePlan(
    risk: MaintenanceRisk,
    appliance: ApplianceProfile
  ): Promise<MaintenancePlan> {
    const userPrompt = buildMaintenancePlanPrompt(
      JSON.stringify(risk, null, 2),
      JSON.stringify(appliance, null, 2)
    );

    const raw = await this.aiService.analyze<any>(
      [
        { role: 'system', content: MAINTENANCE_PLAN_PROMPT },
        { role: 'user', content: userPrompt }
      ],
      'technician',
      'anonymous'
    );

    if (!raw) {
      throw new Error('MaintenancePlanner: AI returned null.');
    }

    const validation = validateMaintenancePlan(raw);

    if (!validation.valid || !validation.result) {
      console.warn('MaintenancePlan validation failed:', validation.errors);
      return {
        recommendedMaintenanceDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        serviceInterval: 'Every 6 months',
        recommendedActions: ['Schedule a general inspection'],
        partsToInspect: [],
        technicianType: 'General'
      };
    }

    return validation.result;
  }
}
