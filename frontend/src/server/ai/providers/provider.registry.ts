import { AIProvider } from './provider.interface';
import { OpenRouterProvider } from './openrouter.provider';
import { GroqProvider } from './groq.provider';
import { OllamaProvider } from './ollama.provider';
import { MockProvider } from './mock.provider';
import { GeminiProvider } from './gemini.provider';

/**
 * ProviderRegistry — a Map-backed service locator for all LLM providers.
 * The Factory retrieves providers by name from this registry so adding a new
 * AI provider only requires registering it here, not changing call sites.
 */
class ProviderRegistry {
  // Map of lowercase provider name → provider instance; enables O(1) lookup by name.
  private providers = new Map<string, AIProvider>();

  constructor() {
    // Register all available LLM providers on startup.
    this.register(new OpenRouterProvider());
    this.register(new GroqProvider());
    this.register(new OllamaProvider());
    // MockProvider is the guaranteed fallback — always registered last for safety.
    this.register(new MockProvider());
    this.register(new GeminiProvider());
  }

  // Stores a provider in the map under its lowercase name for case-insensitive lookup.
  public register(provider: AIProvider): void {
    this.providers.set(provider.name.toLowerCase(), provider);
  }

  // Retrieves a provider by name; returns undefined if not registered.
  public get(name: string): AIProvider | undefined {
    return this.providers.get(name.toLowerCase());
  }

  // Returns all registered providers (useful for health-check dashboards).
  public getAll(): AIProvider[] {
    return Array.from(this.providers.values());
  }
}

// Singleton instance — shared across the app so all calls use the same registry.
export const Registry = new ProviderRegistry();
