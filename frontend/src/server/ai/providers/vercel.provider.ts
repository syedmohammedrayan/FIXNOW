/**
 * Vercel AI SDK Provider
 * =======================
 * Wraps the Vercel AI SDK's core functions (generateText, streamText)
 * into a unified interface that the runtime layer consumes.
 *
 * This file is the ONLY place that directly imports from the `ai` package.
 * All other code accesses AI capabilities through the runtime service.
 *
 * Uses: ai (Vercel AI SDK core)
 */

import { generateText, streamText, type LanguageModel } from 'ai';
import type { RuntimeContext, RuntimeResult, TokenUsage } from '../types';

/**
 * Executes a non-streaming text generation request.
 * Returns the full response after completion.
 *
 * @param model - The Vercel AI SDK language model instance
 * @param context - The runtime context with messages and settings
 * @returns The complete runtime result
 */
export async function executeGeneration(
  model: LanguageModel,
  context: RuntimeContext
): Promise<RuntimeResult> {
  const start = Date.now();

  const result = await generateText({
    model,
    messages: context.messages.map((m) => ({
      role: m.role,
      content: m.content,
    })),
    maxTokens: context.maxTokens ?? 4096,
    temperature: context.temperature ?? 0.7,
    abortSignal: context.timeoutMs
      ? AbortSignal.timeout(context.timeoutMs)
      : undefined,
  });

  const latencyMs = Date.now() - start;

  const usage: TokenUsage = {
    promptTokens: result.usage?.promptTokens ?? 0,
    completionTokens: result.usage?.completionTokens ?? 0,
    totalTokens: result.usage?.totalTokens ?? 0,
  };

  return {
    text: result.text,
    modelUsed: context.modelId,
    provider: 'groq',
    usage,
    latencyMs,
    retries: 0,
    usedFallback: false,
  };
}

/**
 * Executes a streaming text generation request.
 * Returns an async iterable of text chunks.
 *
 * Note: Streaming is used for real-time chat responses.
 * The gateway will determine when to use streaming vs. generation.
 *
 * @param model - The Vercel AI SDK language model instance
 * @param context - The runtime context with messages and settings
 * @returns The streamText result object (contains textStream, etc.)
 */
export async function executeStreamGeneration(
  model: LanguageModel,
  context: RuntimeContext
) {
  const result = streamText({
    model,
    messages: context.messages.map((m) => ({
      role: m.role,
      content: m.content,
    })),
    maxTokens: context.maxTokens ?? 4096,
    temperature: context.temperature ?? 0.7,
    abortSignal: context.timeoutMs
      ? AbortSignal.timeout(context.timeoutMs)
      : undefined,
  });

  return result;
}
