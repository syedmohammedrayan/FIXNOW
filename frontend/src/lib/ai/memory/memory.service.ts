/**
 * FixNow Memory Service
 * 
 * The ONLY public API for AI memory. Every future AI feature 
 * imports this service — nothing else imports Hindsight directly.
 * 
 * recall() — retrieve relevant memories before CascadeAgent runs
 * retain() — store durable knowledge after AI response (async, non-blocking)
 * reflect() — synthesize insights (exposed, not used until Sprint 8)
 */

import { getHindsightClient } from './client';
import type { MemoryRecallResult, MemoryRetainResult } from './types';

class MemoryService {
  /**
   * Recall relevant memories for a given query.
   * Called BEFORE CascadeAgent processes the request.
   */
  async recall(bankId: string, query: string): Promise<MemoryRecallResult> {
    const result: MemoryRecallResult = {
      memories: [],
      bankId,
      query
    };

    try {
      const client = getHindsightClient();
      if (!client) return result;

      const response = await client.recall(bankId, query);

      if (response?.results && Array.isArray(response.results)) {
        result.memories = response.results.map((m: any) => m.text || m.content || String(m));
      }

      if (result.memories.length > 0) {
        console.log(`[Memory] Recalled ${result.memories.length} memories from bank "${bankId}"`);
      }
    } catch (e: any) {
      // Memory recall failure should never break the AI pipeline
      console.warn('[Memory] Recall failed (non-fatal):', e?.message || e);
    }

    return result;
  }

  /**
   * Retain durable knowledge extracted from the conversation.
   * Called AFTER CascadeAgent returns a response.
   * Runs asynchronously — never blocks the streaming response.
   */
  async retain(bankId: string, content: string): Promise<MemoryRetainResult> {
    const result: MemoryRetainResult = { success: false, bankId };

    try {
      const client = getHindsightClient();
      if (!client) return result;

      // Don't retain trivial content
      if (!content || content.trim().length < 20) {
        return result;
      }

      await client.retain(bankId, content);
      result.success = true;
      console.log(`[Memory] Retained knowledge in bank "${bankId}" (${content.length} chars)`);
    } catch (e: any) {
      // Retain failure should never break the AI pipeline
      console.warn('[Memory] Retain failed (non-fatal):', e?.message || e);
    }

    return result;
  }

  /**
   * Reflect on stored memories to synthesize insights.
   * Exposed for future use in Sprint 8 (Admin Analytics).
   * Do NOT call this yet.
   */
  async reflect(bankId: string, query: string): Promise<string[]> {
    try {
      const client = getHindsightClient();
      if (!client) return [];

      const response = await client.reflect?.(bankId, query);
      if (response?.insights && Array.isArray(response.insights)) {
        return response.insights.map((i: any) => i.text || String(i));
      }
    } catch (e: any) {
      console.warn('[Memory] Reflect failed (non-fatal):', e?.message || e);
    }

    return [];
  }
}

export const memoryService = new MemoryService();
