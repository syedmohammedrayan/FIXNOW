/**
 * Gateway Types
 * ==============
 * Type definitions for all AI Gateway request/response structures.
 * Every AI interaction flows through the gateway — these types
 * define the contract between the UI and the AI subsystem.
 */

/**
 * Supported AI request intents.
 * Each intent maps to a specific processing pipeline in the gateway.
 * New agents (Sprint 3+) will add their own intents here.
 */
export type AIRequestIntent =
  | 'chat'         // General conversational AI
  | 'diagnose'     // Issue diagnosis (Sprint 3)
  | 'booking'      // Booking assistance (Sprint 3)
  | 'pricing'      // Pricing recommendations (Sprint 3)
  | 'copilot'      // Technician copilot (Sprint 3)
  | 'health';      // Health check

/**
 * Message structure for conversation history.
 */
export interface AIMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: number;
}

/**
 * Inbound request to the AI Gateway.
 */
export interface GatewayRequest {
  /** Unique request ID for tracing */
  requestId: string;
  /** The intent/purpose of this AI request */
  intent: AIRequestIntent;
  /** The user's message or prompt */
  message: string;
  /** Optional conversation history */
  history?: AIMessage[];
  /** Optional user ID for memory personalization */
  userId?: string;
  /** Optional session ID for conversation continuity */
  sessionId?: string;
  /** Optional model override */
  modelId?: string;
  /** Optional metadata for context */
  metadata?: Record<string, unknown>;
}

/**
 * Outbound response from the AI Gateway.
 */
export interface GatewayResponse {
  /** Echoed request ID for correlation */
  requestId: string;
  /** Whether the request was successful */
  success: boolean;
  /** The AI-generated response text */
  content: string;
  /** Model that was used */
  model: string;
  /** Processing metadata */
  metadata: ResponseMetadata;
  /** Error information (if success is false) */
  error?: string;
}

/**
 * Metadata attached to every AI response.
 */
export interface ResponseMetadata {
  /** Total processing time in milliseconds */
  latencyMs: number;
  /** Number of input tokens used */
  inputTokens?: number;
  /** Number of output tokens generated */
  outputTokens?: number;
  /** Whether memory was used for this request */
  memoryUsed: boolean;
  /** Number of memory items recalled */
  memoriesRecalled?: number;
  /** Provider used (e.g., 'groq') */
  provider: string;
  /** Number of retry attempts */
  retries: number;
  /** Whether CascadeFlow routing was used */
  cascadeRouted: boolean;
}
