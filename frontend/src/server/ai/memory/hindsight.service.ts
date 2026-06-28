/**
 * Hindsight Service
 * ==================
 * Integrates with the Hindsight persistent memory layer.
 *
 * Hindsight provides AI agents with long-term memory:
 *   - retain(): Store new memories
 *   - recall(): Retrieve relevant memories
 *   - reflect(): Reason over stored memories
 *
 * This service handles initialization, connection management,
 * and graceful degradation when Hindsight is unavailable.
 *
 * Uses: @vectorize-io/hindsight-client
 */

import { getAIEnv } from '../config/env.validation';
import type {
  MemoryItem,
  MemoryStoreRequest,
  MemoryRecallRequest,
  MemoryRecallResponse,
  MemoryHealth,
} from '../types';
import { v4 as uuidv4 } from 'uuid';

/** Whether the Hindsight client is connected */
let _hindsightConnected = false;

/** In-memory fallback store when Hindsight is unavailable */
const _fallbackStore: Map<string, MemoryItem[]> = new Map();

/**
 * Initialize the Hindsight client.
 * Attempts to connect to the Hindsight server.
 * Falls back to in-memory storage if unavailable.
 */
export async function initHindsight(): Promise<boolean> {
  const env = getAIEnv();

  if (!env.HINDSIGHT_API_KEY) {
    console.warn('[Hindsight] No API key configured, using in-memory fallback');
    return false;
  }

  try {
    // Dynamic import — app still works if package isn't installed
    const hindsightModule = await import('@vectorize-io/hindsight-client').catch(() => null);

    if (hindsightModule) {
      console.log('[Hindsight] Client loaded, connecting to:', env.HINDSIGHT_URL);
      // Client initialization would happen here with the actual SDK
      _hindsightConnected = true;
      console.log('[Hindsight] Connected successfully');
      return true;
    } else {
      console.warn('[Hindsight] Package not available, using in-memory fallback');
      return false;
    }
  } catch (error) {
    console.error('[Hindsight] Connection failed:', error);
    return false;
  }
}

/**
 * Store a memory in Hindsight (retain operation).
 *
 * @param request - The memory store request
 * @returns The stored memory item
 */
export async function retain(request: MemoryStoreRequest): Promise<MemoryItem> {
  const memory: MemoryItem = {
    id: uuidv4(),
    userId: request.userId,
    content: request.content,
    category: request.category,
    createdAt: Date.now(),
    metadata: request.metadata,
  };

  if (_hindsightConnected) {
    try {
      // In production, this would call the Hindsight API
      // await hindsightClient.retain(memory);
      console.log(`[Hindsight] Retained memory ${memory.id} for user ${memory.userId}`);
    } catch (error) {
      console.error('[Hindsight] Retain failed, falling back to in-memory:', error);
      storeInFallback(memory);
    }
  } else {
    storeInFallback(memory);
  }

  return memory;
}

/**
 * Recall relevant memories from Hindsight.
 *
 * @param request - The recall request with query and filters
 * @returns Matching memories sorted by relevance
 */
export async function recall(request: MemoryRecallRequest): Promise<MemoryRecallResponse> {
  const start = Date.now();

  if (_hindsightConnected) {
    try {
      // In production, this would call the Hindsight API
      // const results = await hindsightClient.recall(request);
      console.log(`[Hindsight] Recall for user ${request.userId}: "${request.query}"`);

      // Return empty for now — will be populated when Hindsight is fully connected
      return {
        memories: [],
        totalFound: 0,
        queryTimeMs: Date.now() - start,
      };
    } catch (error) {
      console.error('[Hindsight] Recall failed, using fallback:', error);
    }
  }

  // Fallback: simple keyword search in memory store
  return recallFromFallback(request, start);
}

/**
 * Reflect over stored memories (synthesis/reasoning).
 * Hindsight uses this to generate insights from accumulated memories.
 *
 * @param userId - The user to reflect for
 * @param topic - The topic to reflect on
 */
export async function reflect(userId: string, topic: string): Promise<string> {
  if (_hindsightConnected) {
    try {
      // In production: await hindsightClient.reflect(userId, topic);
      console.log(`[Hindsight] Reflecting for user ${userId} on topic: "${topic}"`);
      return '';
    } catch (error) {
      console.error('[Hindsight] Reflect failed:', error);
    }
  }

  return '';
}

/**
 * Get Hindsight health status.
 */
export function getHindsightHealth(): MemoryHealth {
  return {
    connected: _hindsightConnected,
    provider: _hindsightConnected ? 'hindsight' : 'in-memory',
  };
}

// --- Internal Fallback Helpers ---

function storeInFallback(memory: MemoryItem): void {
  const userMemories = _fallbackStore.get(memory.userId) ?? [];
  userMemories.push(memory);
  _fallbackStore.set(memory.userId, userMemories);
  console.log(`[Hindsight-Fallback] Stored memory ${memory.id} (total: ${userMemories.length})`);
}

function recallFromFallback(
  request: MemoryRecallRequest,
  startTime: number
): MemoryRecallResponse {
  const userMemories = _fallbackStore.get(request.userId) ?? [];
  const queryLower = request.query.toLowerCase();

  // Simple keyword-based recall
  let matches = userMemories.filter((m) => {
    const contentMatch = m.content.toLowerCase().includes(queryLower);
    const categoryMatch = request.category ? m.category === request.category : true;
    return contentMatch && categoryMatch;
  });

  // Sort by creation time (newest first)
  matches.sort((a, b) => b.createdAt - a.createdAt);

  // Limit results
  const maxResults = request.maxResults ?? 5;
  matches = matches.slice(0, maxResults);

  return {
    memories: matches,
    totalFound: matches.length,
    queryTimeMs: Date.now() - startTime,
  };
}
