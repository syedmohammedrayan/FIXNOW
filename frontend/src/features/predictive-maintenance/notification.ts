/**
 * FixNow AI Workflow 4 — Notification Payload Generator
 *
 * Prepares multi-channel notification payloads (push, email, SMS, WhatsApp)
 * from a customer recommendation. Does NOT send any notifications.
 */

import { FixNowAIService } from '@/lib/ai/service/fixnow-ai.service';
import { PreventiveRecommendation, NotificationPlan } from './types';
import { NOTIFICATION_PROMPT, buildNotificationPrompt } from './prompts';
import { validateNotificationPlan } from './validator';

export class NotificationGenerator {
  private aiService: FixNowAIService;

  constructor(aiService: FixNowAIService) {
    this.aiService = aiService;
  }

  /**
   * Generates notification payloads for all channels.
   * These payloads are returned but NOT sent — sending is handled by the notification service layer.
   */
  async generateNotifications(recommendation: PreventiveRecommendation): Promise<NotificationPlan> {
    const userPrompt = buildNotificationPrompt(
      JSON.stringify(recommendation, null, 2)
    );

    const raw = await this.aiService.analyze<any>(
      [
        { role: 'system', content: NOTIFICATION_PROMPT },
        { role: 'user', content: userPrompt }
      ],
      'customer',
      'anonymous'
    );

    if (!raw) {
      throw new Error('NotificationGenerator: AI returned null.');
    }

    const validation = validateNotificationPlan(raw);

    if (!validation.valid || !validation.result) {
      console.warn('NotificationPlan validation failed:', validation.errors);

      // Safe fallback with the recommendation content
      const fallbackMsg = `${recommendation.title}: ${recommendation.message}`;
      return {
        push: { title: recommendation.title, body: recommendation.message.substring(0, 120) },
        email: { subject: recommendation.title, body: recommendation.message },
        sms: { message: `FixNow: ${recommendation.title}. ${recommendation.message}`.substring(0, 160) },
        whatsapp: { message: fallbackMsg.substring(0, 500) }
      };
    }

    return validation.result;
  }
}
