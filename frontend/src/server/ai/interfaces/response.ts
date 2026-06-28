/**
 * Universal AI Response Interface
 */
export interface AIResponse {
  requestId: string;
  success: boolean;
  content: string;
  provider: string;
  model: string;
  latency: number;
  usage: any;
  metadata: any;
}
