export interface RateLimitRule {
  /** Maximum number of requests allowed in the window. */
  maxRequests: number;
  /** The time window in seconds. */
  windowSeconds: number;
}

export const RATE_LIMIT_RULES = {
  /** Customer limits: 10 requests per minute to prevent AI abuse. */
  CUSTOMER_AI_REQUESTS: { maxRequests: 10, windowSeconds: 60 },
  
  /** Technician limits: 30 requests per minute. */
  TECHNICIAN_AI_REQUESTS: { maxRequests: 30, windowSeconds: 60 },
  
  /** Admin limits: 50 requests per minute. */
  ADMIN_AI_REQUESTS: { maxRequests: 50, windowSeconds: 60 }
};
