/**
 * FixNow AI Diagnosis Engine — Service
 *
 * The public API for the Diagnosis Engine.
 * All methods route through FixNowAIService — never calls Groq,
 * Hindsight, or CascadeFlow directly.
 *
 * Public methods:
 *   diagnoseText()  — text-based problem diagnosis
 *   diagnoseImage() — image-described problem diagnosis
 *   diagnoseVoice() — voice transcript diagnosis (prepared, not implemented)
 */

import { fixNowAIService } from '@/lib/ai/service/fixnow-ai.service';
import { memoryService, customerBank } from '@/lib/ai/memory';
import type { DiagnosisRequest, DiagnosisResult } from './types';
import {
  DIAGNOSIS_SYSTEM_PROMPT,
  DIAGNOSIS_SAFETY_PROMPT,
  DIAGNOSIS_RETRY_PROMPT,
  buildDiagnosisTextPrompt,
  buildDiagnosisImagePrompt,
} from './prompts';
import { diagnosisParser } from './parser';
import { diagnosisValidator } from './validator';

// ─── Safe Fallback ────────────────────────────────────────────

const FALLBACK_RESULT: DiagnosisResult = {
  problem: 'Unable to determine — insufficient information for automated diagnosis.',
  confidence: 0.1,
  urgency: 'Medium',
  estimatedRepair: 'Manual inspection required by a technician.',
  estimatedCost: '₹500-1500 (inspection fee)',
  estimatedTime: '1-2 hours',
  recommendedTechnicianType: 'General',
  safetyAdvice: 'Do not attempt to repair the issue yourself. Ensure the area is safe and wait for a professional assessment.',
  suggestedNextAction: 'Book a general technician for an on-site inspection.',
  needsEmergencyVisit: false,
};

// ─── Service Class ────────────────────────────────────────────

export class DiagnosisService {
  /**
   * Diagnose a customer problem from a text description.
   *
   * Flow: recall memories → build prompt → FixNowAIService.analyze() →
   *       parse → validate → retain diagnosis → return DiagnosisResult
   */
  async diagnoseText(request: DiagnosisRequest): Promise<DiagnosisResult> {
    this.validateRequest(request);

    const userId = request.userId || 'anonymous';
    const bankId = customerBank(userId);

    // 1. Recall relevant memories for this customer
    const memories = await this.recallMemories(bankId, request.problem);

    // 2. Build diagnosis messages
    const userPrompt = buildDiagnosisTextPrompt(
      request.problem,
      request.applianceInfo,
      memories
    );

    const messages = this.buildMessages(userPrompt);

    // 3. Execute through FixNowAIService
    const result = await this.executeWithRetry(messages, userId);

    // 4. Retain the diagnosis in memory for future context
    await this.retainDiagnosis(bankId, request.problem, result);

    return result;
  }

  /**
   * Diagnose a customer problem using an image description + text.
   * Actual computer vision is Module 7. This accepts a text description
   * of what the image shows.
   */
  async diagnoseImage(request: DiagnosisRequest): Promise<DiagnosisResult> {
    this.validateRequest(request);

    if (!request.imageDescription || request.imageDescription.trim().length === 0) {
      throw new Error('[DiagnosisService] diagnoseImage() requires imageDescription.');
    }

    const userId = request.userId || 'anonymous';
    const bankId = customerBank(userId);

    // 1. Recall memories
    const memories = await this.recallMemories(bankId, request.problem);

    // 2. Build image-aware prompt
    const userPrompt = buildDiagnosisImagePrompt(
      request.problem,
      request.imageDescription,
      request.applianceInfo,
      memories
    );

    const messages = this.buildMessages(userPrompt);

    // 3. Execute
    const result = await this.executeWithRetry(messages, userId);

    // 4. Retain
    await this.retainDiagnosis(bankId, request.problem, result);

    return result;
  }

  /**
   * Diagnose a customer problem from a voice transcript.
   * Prepared interface — not implemented until Module 6.
   */
  async diagnoseVoice(_request: DiagnosisRequest): Promise<DiagnosisResult> {
    throw new Error('[DiagnosisService] Voice diagnosis is not yet implemented. Awaiting Module 6 (Voice Assistant).');
  }

  // ─── Private Methods ──────────────────────────────────────

  /**
   * Validate the incoming request.
   */
  private validateRequest(request: DiagnosisRequest): void {
    if (!request || typeof request.problem !== 'string' || request.problem.trim().length < 5) {
      throw new Error('[DiagnosisService] Invalid request: "problem" must be a string with at least 5 characters.');
    }
  }

  /**
   * Recall relevant memories from Hindsight via the memory service.
   */
  private async recallMemories(bankId: string, query: string): Promise<string[]> {
    try {
      const recalled = await memoryService.recall(bankId, query);
      return recalled.memories;
    } catch (e) {
      console.warn('[DiagnosisService] Memory recall failed (non-fatal):', e);
      return [];
    }
  }

  /**
   * Build the message array for the AI pipeline.
   */
  private buildMessages(userPrompt: string): Array<{ role: string; content: string }> {
    return [
      { role: 'system', content: `${DIAGNOSIS_SYSTEM_PROMPT}\n\n${DIAGNOSIS_SAFETY_PROMPT}` },
      { role: 'user', content: userPrompt },
    ];
  }

  /**
   * Execute diagnosis through FixNowAIService with one retry on malformed output.
   */
  private async executeWithRetry(
    messages: Array<{ role: string; content: string }>,
    userId: string
  ): Promise<DiagnosisResult> {
    // First attempt
    const firstResult = await this.executeDiagnosis(messages, userId);
    if (firstResult) return firstResult;

    // Retry with stricter prompt
    console.warn('[DiagnosisService] First attempt returned malformed output. Retrying with strict prompt.');

    const retryMessages = [
      ...messages,
      { role: 'assistant', content: 'I apologize, let me provide the correct JSON format.' },
      { role: 'user', content: DIAGNOSIS_RETRY_PROMPT },
    ];

    const retryResult = await this.executeDiagnosis(retryMessages, userId);
    if (retryResult) return retryResult;

    // Both attempts failed — return safe fallback
    console.error('[DiagnosisService] Both diagnosis attempts returned malformed output. Returning fallback.');
    return { ...FALLBACK_RESULT };
  }

  /**
   * Single execution attempt: call AI → parse → validate.
   */
  private async executeDiagnosis(
    messages: Array<{ role: string; content: string }>,
    userId: string
  ): Promise<DiagnosisResult | null> {
    try {
      // Route through FixNowAIService — the ONLY AI entry point
      const rawText = await fixNowAIService.ask(messages, 'customer', userId);

      if (!rawText || rawText.trim().length === 0) {
        console.warn('[DiagnosisService] AI returned empty response.');
        return null;
      }

      // Parse
      const parsed = diagnosisParser.parse(rawText);
      if (!parsed) {
        console.warn('[DiagnosisService] Parser failed to extract DiagnosisResult from AI response.');
        return null;
      }

      // Validate
      const validation = diagnosisValidator.validate(parsed);
      if (!validation.valid) {
        console.warn('[DiagnosisService] Validation failed:', validation.errors);
        return null;
      }

      return validation.result;
    } catch (e) {
      console.error('[DiagnosisService] Diagnosis execution failed:', e);
      return null;
    }
  }

  /**
   * Retain the diagnosis result in Hindsight for future recall.
   */
  private async retainDiagnosis(
    bankId: string,
    originalProblem: string,
    result: DiagnosisResult
  ): Promise<void> {
    try {
      const retainContent = [
        `Diagnosis performed.`,
        `Problem reported: ${originalProblem}`,
        `Identified issue: ${result.problem}`,
        `Confidence: ${result.confidence}`,
        `Urgency: ${result.urgency}`,
        `Repair: ${result.estimatedRepair}`,
        `Cost: ${result.estimatedCost}`,
        `Technician needed: ${result.recommendedTechnicianType}`,
      ].join('\n');

      await memoryService.retain(bankId, retainContent);
    } catch (e) {
      // Memory retention failure must never break the diagnosis pipeline
      console.warn('[DiagnosisService] Memory retain failed (non-fatal):', e);
    }
  }
}

export const diagnosisService = new DiagnosisService();
