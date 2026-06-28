/**
 * FixNow AI Workflow 6 — Admin Intelligence Service
 *
 * The public facade for the Operations & Admin Intelligence workflow.
 * Exposes 8 methods for generating admin-grade operational insights.
 *
 * All AI access routes through FixNowAIService only.
 */

import { FixNowAIService } from '@/lib/ai/service/fixnow-ai.service';
import { OpsSummaryEngine } from './ops-summary';
import { TechnicianPerformanceEngine } from './technician-performance';
import { CustomerRiskEngine } from './customer-risk';
import { RecurringFaultsEngine } from './recurring-faults';
import { SLARiskEngine } from './sla-risk';
import { ModelUsageEngine } from './model-usage';
import { WEEKLY_BRIEF_PROMPT, ADMIN_ALERT_PROMPT } from './prompts';
import { validateAdminAlert } from './validator';

import {
  OperationsSummary,
  TechnicianPerformanceInsight,
  CustomerRiskInsight,
  RecurringFaultInsight,
  SLAComplianceInsight,
  ModelUsageInsight,
  WeeklyAdminBrief,
  AdminAlert
} from './types';

export class AdminIntelligenceService {
  private aiService: FixNowAIService;
  private opsSummary: OpsSummaryEngine;
  private techPerformance: TechnicianPerformanceEngine;
  private customerRisk: CustomerRiskEngine;
  private recurringFaults: RecurringFaultsEngine;
  private slaRisk: SLARiskEngine;
  private modelUsage: ModelUsageEngine;

  constructor() {
    this.aiService = new FixNowAIService();
    this.opsSummary = new OpsSummaryEngine(this.aiService);
    this.techPerformance = new TechnicianPerformanceEngine(this.aiService);
    this.customerRisk = new CustomerRiskEngine(this.aiService);
    this.recurringFaults = new RecurringFaultsEngine(this.aiService);
    this.slaRisk = new SLARiskEngine(this.aiService);
    this.modelUsage = new ModelUsageEngine(this.aiService);
  }

  /**
   * Generates a daily/weekly operations summary.
   */
  async generateOperationsSummary(platformData: string): Promise<OperationsSummary> {
    return this.opsSummary.generateSummary(platformData);
  }

  /**
   * Analyzes a technician's historical performance.
   */
  async analyzeTechnicianPerformance(technicianData: string): Promise<TechnicianPerformanceInsight> {
    return this.techPerformance.analyze(technicianData);
  }

  /**
   * Detects customers at risk of escalation or churn.
   */
  async analyzeCustomerRisk(customerData: string): Promise<CustomerRiskInsight> {
    return this.customerRisk.analyze(customerData);
  }

  /**
   * Detects recurring appliance fault patterns platform-wide.
   */
  async detectRecurringFaults(repairData: string): Promise<RecurringFaultInsight[]> {
    return this.recurringFaults.detect(repairData);
  }

  /**
   * Estimates SLA compliance risk for a job.
   */
  async analyzeSLARisk(jobData: string): Promise<SLAComplianceInsight> {
    return this.slaRisk.analyze(jobData);
  }

  /**
   * Analyzes CascadeFlow runtime traces for model usage insights.
   */
  async analyzeModelUsage(traceData: string): Promise<ModelUsageInsight> {
    return this.modelUsage.analyze(traceData);
  }

  /**
   * Generates a comprehensive weekly admin brief combining all insights.
   */
  async generateWeeklyAdminBrief(allPlatformData: string): Promise<WeeklyAdminBrief> {
    const raw = await this.aiService.analyze<any>(
      [
        { role: 'system', content: WEEKLY_BRIEF_PROMPT },
        { role: 'user', content: `Full Platform Data for Weekly Brief:\n${allPlatformData}` }
      ],
      'technician',
      'admin'
    );

    if (!raw) throw new Error('WeeklyAdminBrief: AI returned null.');

    // The weekly brief is a complex composite — we trust the AI structure
    // but validate the required top-level fields.
    return raw as WeeklyAdminBrief;
  }

  /**
   * Generates a specific admin alert from an operational context.
   */
  async generateAdminAlert(context: string): Promise<AdminAlert> {
    const raw = await this.aiService.analyze<any>(
      [
        { role: 'system', content: ADMIN_ALERT_PROMPT },
        { role: 'user', content: `Alert Context:\n${context}` }
      ],
      'technician',
      'admin'
    );

    if (!raw) throw new Error('AdminAlert: AI returned null.');

    const validation = validateAdminAlert(raw);
    if (!validation.valid || !validation.result) {
      console.warn('AdminAlert validation failed:', validation.errors);
      return {
        title: 'Unprocessable Alert',
        description: context,
        severity: 'Warning',
        category: 'operations',
        recommendedAction: 'Review manually.',
        timestamp: new Date().toISOString()
      };
    }

    return validation.result;
  }
}

// Export a singleton instance for ease of use
export const adminIntelligenceService = new AdminIntelligenceService();
