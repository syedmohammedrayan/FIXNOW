import { FixNowCascadeAgent } from '../cascadeflow';
import { memoryService, customerBank, technicianBank } from '../memory';
import { contextBuilder, AIContext } from './context-builder';
import { promptBuilder } from './prompt-builder';
import { responseParser } from './response-parser';
import { memoryExtractor } from './memory-extractor';

export class FixNowAIService {
  private agent: any;

  constructor() {
    this.agent = new FixNowCascadeAgent();
  }

  /**
   * Primary streaming entry point for chat interfaces.
   * Orchestrates recall -> prompt -> cascade -> stream -> retain.
   */
  async stream(messages: any[], role: string = 'customer', userId: string = 'anonymous'): Promise<Response> {
    // 1. Build Context (includes Hindsight Recall)
    const context = await contextBuilder.buildContext(messages, role, userId);

    // 2. Build Prompt
    const systemPrompt = promptBuilder.buildSystemPrompt(context);
    
    // Normalize messages to ensure they use 'content' string, as some providers/wrappers choke on 'parts' arrays
    const normalizedMessages = messages
      .filter((m: any) => m.role !== 'system')
      .map((m: any) => ({
        role: m.role,
        content: m.content || (m.parts ? m.parts.map((p: any) => p.text).join('') : '')
      }));

    const finalMessages = [systemPrompt, ...normalizedMessages];

    // 3. Execute AI (CascadeAgent)
    const response = await this.agent.createStream(finalMessages);

    // 4. Extract Memory and Retain (Asynchronous)
    if (context.request && response.body) {
      const [streamForClient, streamForRetain] = response.body.tee();

      // Fire-and-forget memory retention
      (async () => {
        try {
          const reader = streamForRetain.getReader();
          const decoder = new TextDecoder();
          let fullText = '';
          
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            fullText += decoder.decode(value, { stream: true });
          }

          // Decode Vercel AI SDK Data Protocol for retention
          const protocolRegex = /^(\d+):(.+)$/;
          let decodedText = "";

          for (const line of fullText.split(/\r?\n/)) {
            const match = line.match(protocolRegex);
            if (!match) continue;
            const [, type, payload] = match;
            if (type !== "0") continue;
            try {
              decodedText += JSON.parse(payload);
            } catch (err) {}
          }
          
          const cleanText = decodedText.trim() ? decodedText.trim() : fullText;
          const retainContent = memoryExtractor.extractForRetention(context, cleanText);
          
          if (retainContent) {
            const bankId = role === 'technician' ? technicianBank(userId) : customerBank(userId);
            await memoryService.retain(bankId, retainContent);
          }
        } catch (e) {
          console.warn('[FixNowAIService] Memory retain failed (non-fatal):', e);
        }
      })();

      return new Response(streamForClient, {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers
      });
    }

    return response;
  }

  /**
   * Non-streaming question-answer (e.g. simple queries).
   */
  async ask(messages: any[], role: string = 'customer', userId: string = 'anonymous'): Promise<string> {
    const response = await this.stream(messages, role, userId);
    if (!response.body) return '';

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullText = '';
    
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      fullText += decoder.decode(value, { stream: true });
    }

    // Decode Vercel AI SDK Data Protocol
    const protocolRegex = /^(\d+):(.+)$/;
    let decodedText = "";

    for (const line of fullText.split(/\r?\n/)) {
      const match = line.match(protocolRegex);

      if (!match) continue;

      const [, type, payload] = match;

      // Only text chunks
      if (type !== "0") continue;

      try {
        decodedText += JSON.parse(payload);
      } catch (err) {
        console.error("Failed to decode chunk:", payload);
      }
    }

    console.log("FULL TEXT");
    console.log(fullText);

    console.log("DECODED");
    console.log(decodedText);

    if (decodedText.trim()) {
      return decodedText.trim();
    }

    return fullText;
  }

  /**
   * Analyzes an input and returns a structured object.
   * Placeholder implementation for future Sprints (e.g., Diagnosis AI).
   */
  async analyze<T>(messages: any[], role: string = 'customer', userId: string = 'anonymous'): Promise<T | null> {
    const textResponse = await this.ask(messages, role, userId);
    return responseParser.parseJson<T>(textResponse);
  }

  /**
   * Summarizes an interaction or text.
   * Placeholder implementation.
   */
  async summarize(messages: any[], role: string = 'customer', userId: string = 'anonymous'): Promise<string> {
    const summaryMessages = [
      ...messages,
      { role: 'user', content: 'Please summarize the key points of the preceding conversation or text.' }
    ];
    return await this.ask(summaryMessages, role, userId);
  }
}

export const fixNowAIService = new FixNowAIService();
