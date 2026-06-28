import { AIProvider } from './provider.interface';
import { OpenRouterProvider } from './openrouter.provider';
import { GroqProvider } from './groq.provider';
import { OllamaProvider } from './ollama.provider';
import { MockProvider } from './mock.provider';
import { GeminiProvider } from './gemini.provider';

class ProviderRegistry {
  private providers = new Map<string, AIProvider>();

  constructor() {
    this.register(new OpenRouterProvider());
    this.register(new GroqProvider());
    this.register(new OllamaProvider());
    this.register(new MockProvider());
    this.register(new GeminiProvider());
  }

  public register(provider: AIProvider): void {
    this.providers.set(provider.name.toLowerCase(), provider);
  }

  public get(name: string): AIProvider | undefined {
    return this.providers.get(name.toLowerCase());
  }

  public getAll(): AIProvider[] {
    return Array.from(this.providers.values());
  }
}

// Singleton instance
export const Registry = new ProviderRegistry();
