import { CascadeAgent } from 'cascadeflow-core-smr';
import { createChatHandler } from 'cascadeflow-vercel-ai-smr';
import { cascadeConfig } from './config';
import { createGroq } from '@ai-sdk/groq';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { streamText } from 'ai';

export class FixNowCascadeAgent {
  private cascadeAgent: any;

  constructor() {
    // Initialize CascadeAgent with Groq models
    // CascadeAgent handles provider routing internally via GROQ_API_KEY env var
    this.cascadeAgent = new CascadeAgent({
      models: [
        { name: 'meta-llama/llama-4-scout-17b-16e-instruct', provider: 'groq' as any, cost: 0.000000 },
        { name: cascadeConfig.defaultModels.verifier, provider: 'groq' as any, cost: 0.000000 }
      ],
      quality: {
        threshold: 0.40,
        requireMinimumTokens: 5
      }
    });
  }

  async createStream(messages: any[]): Promise<Response> {
    try {
      // Use the official cascadeflow Vercel AI handler
      // This wraps CascadeAgent.run() into a streaming Response
      const handler = createChatHandler(this.cascadeAgent, {
        protocol: 'data',
        stream: true,
        temperature: 0.7
      });

      const req = new Request('http://localhost/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages })
      });

      return await handler(req);
    } catch (e: any) {
      // Fallback: bypass CascadeAgent entirely and go direct to Groq
      console.warn('[FixNowCascadeAgent] Cascade handler failed, falling back to direct Groq:', e?.message || e);
      
      // Dynamically pool all keys
      const groqKeys = Object.keys(process.env)
        .filter(key => key.startsWith('GROQ_API_KEY'))
        .map(key => process.env[key])
        .filter(val => val && val.startsWith('gsk_'));
        
      const groqApiKey = groqKeys.length > 0 ? groqKeys[Math.floor(Math.random() * groqKeys.length)] : '';
      const geminiApiKey = process.env.GEMINI_API_KEY || '';
      
      let providerModel: any;
      
      if (groqApiKey) {
        const groq = createGroq({ apiKey: groqApiKey });
        providerModel = groq(cascadeConfig.defaultModels.verifier);
        console.warn('[FixNowCascadeAgent] Using Groq fallback');
      } else if (geminiApiKey) {
        const google = createGoogleGenerativeAI({ apiKey: geminiApiKey });
        providerModel = google('gemini-2.5-flash-lite');
        console.warn('[FixNowCascadeAgent] Using Gemini fallback');
      } else {
        throw new Error('No Groq or Gemini API keys configured in environment.');
      }
      
      const systemMessage = messages.find(m => m.role === 'system')?.content || '';
      const coreMessages = messages.filter(m => m.role !== 'system');

      const result = await streamText({
        model: providerModel,
        system: systemMessage,
        messages: coreMessages,
        temperature: 0.7,
      });

      return (result as any).toDataStreamResponse ? (result as any).toDataStreamResponse() : 
             (result as any).toTextStreamResponse ? (result as any).toTextStreamResponse() : 
             (result as any).toUIMessageStreamResponse();
    }
  }
}
