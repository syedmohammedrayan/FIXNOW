/**
 * Memory Types
 * ==============
 * Type definitions for the Hindsight memory layer.
 * Defines structures for storing, recalling, and managing
 * persistent AI memories across sessions.
 */

/**
 * A single memory item stored in Hindsight.
 */
export interface MemoryItem {
  /** Unique memory identifier */
  id: string;
  /** The user this memory belongs to */
  userId: string;
  /** Memory content (what the AI should remember) */
  content: string;
  /** Memory category for organized recall */
  category: MemoryCategory;
  /** Relevance score (0-1) from recall */
  relevance?: number;
  /** When the memory was created */
  createdAt: number;
  /** When the memory was last accessed */
  lastAccessedAt?: number;
  /** Optional structured metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Categories for organizing memories.
 * Hindsight uses these to scope recall queries.
 */
export type MemoryCategory =
  | 'preference'     // User preferences and settings
  | 'interaction'    // Past conversation summaries
  | 'issue'          // Reported issues and resolutions
  | 'booking'        // Booking history context
  | 'feedback'       // User feedback and satisfaction
  | 'technician'     // Technician-specific context
  | 'general';       // Uncategorized memories

/**
 * Request to store a new memory.
 */
export interface MemoryStoreRequest {
  userId: string;
  content: string;
  category: MemoryCategory;
  metadata?: Record<string, unknown>;
}

/**
 * Request to recall memories.
 */
export interface MemoryRecallRequest {
  userId: string;
  query: string;
  category?: MemoryCategory;
  maxResults?: number;
}

/**
 * Response from a recall operation.
 */
export interface MemoryRecallResponse {
  memories: MemoryItem[];
  totalFound: number;
  queryTimeMs: number;
}

/**
 * Memory service health status.
 */
export interface MemoryHealth {
  connected: boolean;
  provider: 'hindsight' | 'in-memory';
  latencyMs?: number;
  error?: string;
}
