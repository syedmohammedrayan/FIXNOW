/**
 * FixNow AI Workflow 4 — Predictive Maintenance Service
 *
 * The public facade for the Predictive Maintenance Intelligence workflow.
 * Chains risk analysis → maintenance planning → recommendations → notifications.
 *
 * All AI access routes through FixNowAIService only.
 */

import { FixNowAIService } from '@/lib/ai/service/fixnow-ai.service';
import { RiskEngine } from './risk-engine';
import { MaintenancePlanner } from './maintenance-planner';
import { RecommendationGenerator } from './recommendation';
import { NotificationGenerator } from './notification';
import {
  ApplianceProfile,
  RepairHistoryEntry,
  MaintenanceRisk,
  MaintenancePlan,
  PreventiveRecommendation,
  NotificationPlan
} from './types';

export class PredictiveMaintenanceService {
  private aiService: FixNowAIService;
  private riskEngine: RiskEngine;
  private planner: MaintenancePlanner;
  private recommender: RecommendationGenerator;
  private notifier: NotificationGenerator;

  constructor() {
    this.aiService = new FixNowAIService();
    this.riskEngine = new RiskEngine(this.aiService);
    this.planner = new MaintenancePlanner(this.aiService);
    this.recommender = new RecommendationGenerator(this.aiService);
    this.notifier = new NotificationGenerator(this.aiService);
  }

  /**
   * PRIMARY: Analyzes appliance risk based on repair history.
   *
   * Example: LG AC with 3 gas refills in 12 months →
   *   { riskScore: 0.82, healthStatus: "At Risk", predictedIssue: "Compressor Wear", ... }
   */
  async analyzeRisk(
    appliance: ApplianceProfile,
    repairHistory: RepairHistoryEntry[],
    userId?: string,
    memoryStr?: string
  ): Promise<MaintenanceRisk> {
    return this.riskEngine.analyzeRisk(appliance, repairHistory, userId, memoryStr);
  }

  /**
   * Generates a preventive maintenance plan from a risk analysis.
   */
  async generateMaintenancePlan(
    risk: MaintenanceRisk,
    appliance: ApplianceProfile
  ): Promise<MaintenancePlan> {
    return this.planner.generateMaintenancePlan(risk, appliance);
  }

  /**
   * Generates customer-friendly recommendations from a maintenance plan.
   */
  async generateRecommendations(
    plan: MaintenancePlan,
    risk: MaintenanceRisk
  ): Promise<PreventiveRecommendation> {
    return this.recommender.generateRecommendation(plan, risk);
  }

  /**
   * Generates multi-channel notification payloads. Does NOT send.
   */
  async generateNotifications(recommendation: PreventiveRecommendation): Promise<NotificationPlan> {
    return this.notifier.generateNotifications(recommendation);
  }

  /**
   * CONVENIENCE: Runs the full pipeline end-to-end.
   * Risk → Plan → Recommendation → Notifications
   */
  async runFullPipeline(
    appliance: ApplianceProfile,
    repairHistory: RepairHistoryEntry[],
    userId?: string
  ): Promise<{
    risk: MaintenanceRisk;
    plan: MaintenancePlan;
    recommendation: PreventiveRecommendation;
    notifications: NotificationPlan;
  }> {
    const risk = await this.analyzeRisk(appliance, repairHistory, userId);
    const plan = await this.generateMaintenancePlan(risk, appliance);
    const recommendation = await this.generateRecommendations(plan, risk);
    const notifications = await this.generateNotifications(recommendation);

    return { risk, plan, recommendation, notifications };
  }
}

// Export a singleton instance for ease of use
export const predictiveMaintenanceService = new PredictiveMaintenanceService();
