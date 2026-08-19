import { createGroq } from '@ai-sdk/groq';
import { streamText } from 'ai';
import { AIProvider } from './provider.interface';

export class GroqProvider implements AIProvider {
  name = 'groq';

  async createStream(messages: any[], modelOverride?: string): Promise<Response> {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      throw new Error('No GROQ_API_KEY configured');
    }

    const groq = createGroq({ apiKey });
    const modelName = modelOverride || process.env.DEFAULT_MODEL || 'meta-llama/llama-4-scout-17b-16e-instruct';

    const result = await streamText({
      model: groq(modelName),
      messages,
      temperature: 0.7,
    });

    return result.toUIMessageStreamResponse();
  }
}
