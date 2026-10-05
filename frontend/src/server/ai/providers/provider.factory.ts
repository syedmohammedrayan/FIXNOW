import { AIProvider } from './provider.interface';
import { Registry } from './provider.registry';
import { ProviderConfig } from './provider.config';

/**
 * ProviderFactory — resolves which LLM provider to use for a given request.
 * Centralising provider selection here keeps routing logic out of business code.
 * Callers simply ask for a provider by name and get the correct implementation.
 */
export class ProviderFactory {
  /**
   * Returns the requested provider from the Registry.
   * Falls back to 'mock' if the requested provider name is unrecognised —
   * this prevents the app from crashing when an env var points to a typo'd provider.
   */
  static getProvider(name?: string): AIProvider {
    const config = ProviderConfig.getInstance();
    // Use the provided name, or fall back to the configured default provider.
    const providerName = name || config.defaultProvider;
    
    let provider = Registry.get(providerName);
    
    if (!provider) {
      // Unknown provider requested — warn and degrade gracefully to MockProvider.
      console.warn(`[ProviderFactory] Provider '${providerName}' not found. Falling back to MockProvider.`);
      provider = Registry.get('mock');
    }

    if (!provider) {
      // MockProvider itself is missing — this is a critical init error (should never happen).
      throw new Error('Critical Initialization Error: MockProvider not registered');
    }

    return provider;
  }
}
