/**
 * Request Validator Middleware
 * =============================
 * Validates incoming AI requests using Zod schemas.
 * Ensures all requests conform to the expected structure
 * before they reach the gateway.
 *
 * Uses: zod
 */

import { z } from 'zod';

/**
 * Schema for AI request messages.
 */
const messageSchema = z.object({
  role: z.enum(['user', 'assistant', 'system']),
  content: z.string().min(1, 'Message content cannot be empty'),
  timestamp: z.number().optional(),
});

/**
 * Schema for the full AI gateway request body.
 */
export const aiRequestSchema = z.object({
  /** The intent/purpose of this request */
  intent: z
    .enum(['chat', 'diagnose', 'booking', 'pricing', 'copilot', 'health'])
    .default('chat'),

  /** The user's current message */
  message: z
    .string()
    .min(1, 'Message is required')
    .max(10000, 'Message too long (max 10,000 characters)'),

  /** Optional conversation history */
  history: z.array(messageSchema).max(50, 'Too many history messages').optional(),

  /** Optional user ID for personalization */
  userId: z.string().optional(),

  /** Optional session ID for continuity */
  sessionId: z.string().optional(),

  /** Optional model override */
  modelId: z.string().optional(),

  /** Optional metadata */
  metadata: z.record(z.unknown()).optional(),
});

/** Inferred type from the schema */
export type AIRequestBody = z.infer<typeof aiRequestSchema>;

/**
 * Validate an incoming request body.
 * Returns the validated data or throws a descriptive error.
 *
 * @param body - Raw request body from the API route
 * @returns Validated and typed request data
 * @throws ZodError with detailed validation messages
 */
export function validateAIRequest(body: unknown): AIRequestBody {
  return aiRequestSchema.parse(body);
}

/**
 * Safe validation that returns success/error instead of throwing.
 *
 * @param body - Raw request body
 * @returns Result object with data or error
 */
export function safeValidateAIRequest(body: unknown): {
  success: boolean;
  data?: AIRequestBody;
  error?: string;
} {
  const result = aiRequestSchema.safeParse(body);

  if (result.success) {
    return { success: true, data: result.data };
  }

  const errorMessages = result.error.errors
    .map((e) => `${e.path.join('.')}: ${e.message}`)
    .join('; ');

  return { success: false, error: errorMessages };
}
