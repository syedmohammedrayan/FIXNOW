/**
 * Universal AI Request Interface
 * Every agent uses this. Never create another request object.
 */
export interface AIRequest {
  requestId: string;
  userId: string;
  sessionId: string;
  agent: string;
  messages: any[];
  attachments: any[];
  metadata: Record<string, any>;
}
