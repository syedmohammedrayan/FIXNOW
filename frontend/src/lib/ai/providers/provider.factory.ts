import { AIProvider } from './provider.interface';
import { GroqProvider } from './groq.provider';

export class ProviderFactory {
  static getProvider(): AIProvider {
    return new GroqProvider();
  }
}
