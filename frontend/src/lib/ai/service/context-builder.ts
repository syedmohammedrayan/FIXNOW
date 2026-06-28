import { memoryService, customerBank, technicianBank } from '../memory';

export interface AIContext {
  role: string;
  userId: string;
  request: string;
  memories: string[];
  bookingContext?: any;
  applianceContext?: any;
}

export class ContextBuilder {
  /**
   * Merges user, request, and memories into a single context object.
   */
  async buildContext(messages: any[], role: string, userId: string): Promise<AIContext> {
    // Extract the latest user query
    const userMessages = messages.filter((m: any) => m.role === 'user');
    const latestUserMsg = userMessages[userMessages.length - 1];
    let userQuery = '';
    if (typeof latestUserMsg?.content === 'string') {
      userQuery = latestUserMsg.content;
    } else if (Array.isArray(latestUserMsg?.content)) {
      userQuery = latestUserMsg.content.filter((p: any) => p.type === 'text').map((p: any) => p.text).join(' ');
    } else if (latestUserMsg?.parts) {
      userQuery = latestUserMsg.parts.map((p: any) => p.text).join('');
    }

    const bankId = role === 'technician' ? technicianBank(userId) : customerBank(userId);
    let memories: string[] = [];

    if (userQuery) {
      try {
        const recalled = await memoryService.recall(bankId, userQuery);
        memories = recalled.memories;
      } catch (e) {
        console.warn('[ContextBuilder] Memory recall failed:', e);
      }
    }

    return {
      role,
      userId,
      request: userQuery,
      memories,
      // Future expansions: bookingContext, applianceContext can be fetched here
    };
  }
}

export const contextBuilder = new ContextBuilder();
