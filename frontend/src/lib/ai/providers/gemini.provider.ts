import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { streamText } from 'ai';
import { AIProvider } from './provider.interface';

export class GeminiProvider implements AIProvider {
  name = 'gemini';

  async createStream(messages: any[], modelOverride?: string): Promise<Response> {
    const apiKey = process.env.GEMINI_API_KEY || '';
    if (!apiKey) {
      throw new Error('No Gemini API keys configured in environment.');
    }

    const google = createGoogleGenerativeAI({ apiKey });
    const modelName = modelOverride || 'gemini-2.5-flash-lite';

    const result = await streamText({
      model: google(modelName) as any,
      messages,
      temperature: 0.7,
    });

    return result.toUIMessageStreamResponse();
  }
}
