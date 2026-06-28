/**
 * Shared AI Domain Types
 */

export type AIIntent = 'chat' | 'diagnose' | 'pricing' | 'booking' | 'general';
export type AIPriority = 'speed' | 'quality' | 'balanced';

export interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}
