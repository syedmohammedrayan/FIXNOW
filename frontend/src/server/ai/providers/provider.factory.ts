import { AIProvider } from './provider.interface';
import { Registry } from './provider.registry';
import { ProviderConfig } from './provider.config';

export class ProviderFactory {
  /**
   * Resolves the requested provider from the Registry.
   * Falls back to 'mock' if the requested provider is completely unknown.
   */
  static getProvider(name?: string): AIProvider {
    const config = ProviderConfig.getInstance();
    const providerName = name || config.defaultProvider;
    
    let provider = Registry.get(providerName);
    
    if (!provider) {
      console.warn(`[ProviderFactory] Provider '${providerName}' not found. Falling back to MockProvider.`);
      provider = Registry.get('mock');
    }

    if (!provider) {
      throw new Error('Critical Initialization Error: MockProvider not registered');
    }

    return provider;
  }
}
