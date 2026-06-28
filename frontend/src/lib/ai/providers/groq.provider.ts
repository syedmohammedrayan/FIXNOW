import { createGroq } from '@ai-sdk/groq';
import { streamText } from 'ai';
import { AIProvider } from './provider.interface';

export class GroqProvider implements AIProvider {
  name = 'groq';

  async createStream(messages: any[], modelOverride?: string): Promise<Response> {
    // Dynamically gather all GROQ_API_KEY variables for load balancing
    const groqKeys = Object.keys(process.env)
      .filter(key => key.startsWith('GROQ_API_KEY'))
      .map(key => process.env[key])
      .filter(val => val && val.startsWith('gsk_'));

    if (groqKeys.length === 0) {
      throw new Error('No Groq API keys configured in environment.');
    }

    // Pick a random key from the pool to load balance rate limits
    const apiKey = groqKeys[Math.floor(Math.random() * groqKeys.length)];

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
