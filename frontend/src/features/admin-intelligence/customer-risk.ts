/**
 * FixNow AI Workflow 6 — Customer Risk Analyzer
 *
 * Detects customers likely to escalate or churn using
 * historical memory and service patterns.
 */

import { FixNowAIService } from '@/lib/ai/service/fixnow-ai.service';
import { CustomerRiskInsight } from './types';
import { CUSTOMER_RISK_PROMPT } from './prompts';
import { validateCustomerRisk } from './validator';

export class CustomerRiskEngine {
  private aiService: FixNowAIService;

  constructor(aiService: FixNowAIService) {
    this.aiService = aiService;
  }

  /**
   * Analyzes customer service history to predict escalation risk.
   */
  async analyze(customerData: string, userId?: string): Promise<CustomerRiskInsight> {
    const raw = await this.aiService.analyze<any>(
      [
        { role: 'system', content: CUSTOMER_RISK_PROMPT },
        { role: 'user', content: `Customer Data:\n${customerData}` }
      ],
      'customer',
      userId || 'admin'
    );

    if (!raw) throw new Error('CustomerRiskEngine: AI returned null.');

    const validation = validateCustomerRisk(raw);
    if (!validation.valid || !validation.result) {
      console.warn('CustomerRisk validation failed:', validation.errors);
      return {
        customerId: 'unknown', customerName: 'Unknown',
        riskScore: 0.5, riskLevel: 'Medium',
        riskFactors: ['Insufficient data.'], mitigationActions: ['Review manually.']
      };
    }

    return validation.result;
  }
}
