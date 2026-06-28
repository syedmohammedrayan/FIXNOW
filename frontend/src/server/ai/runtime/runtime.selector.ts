import { AIProvider } from '../providers/provider.interface';
import { ProviderFactory } from '../providers/provider.factory';
import { RuntimeExecutionConfig } from './runtime.types';

/**
 * Provider & Model Selector
 * 
 * Future Sprint 6: This logic is entirely stripped out and replaced by 
 * cascadeflow-core-smr machine learning routing hook.   
 * 
 * For now, this is our heuristic-based fallback logic to test the architecture.
 */
export class RuntimeSelector {

  /**
   * Determines the optimal provider based on the configuration intent/priority.
   */
  static selectProvider(config: RuntimeExecutionConfig): AIProvider {
    if (config.priority === 'speed') {
      return ProviderFactory.getProvider('groq'); // Groq is generally fastest
    }

    if (config.priority === 'quality' || config.intent === 'diagnose') {
      return ProviderFactory.getProvider('openrouter'); // Use larger models
    }

    // Default balanced selection
    return ProviderFactory.getProvider(process.env.AI_PROVIDER || 'openrouter');
  }

  /**
   * Determines the optimal model for the chosen provider.
   */
  static selectModel(provider: AIProvider, config: RuntimeExecutionConfig): string {
    if (provider.name === 'groq') {
      return 'llama3-8b-8192';
    }

    if (provider.name === 'openrouter') {
      return 'qwen/qwen3-coder:free';
    }

    if (provider.name === 'ollama') {
      return 'llama3';
    }

    return 'dummy-model';
  }

  /**
   * Gets the fallback provider if the primary provider fails.
   */
  static getFallbackProvider(failedProviderName: string): AIProvider {
    if (failedProviderName === 'openrouter') return ProviderFactory.getProvider('groq');
    if (failedProviderName === 'groq') return ProviderFactory.getProvider('openrouter');

    // Always fall back to mock if everything else fails
    return ProviderFactory.getProvider('mock');
  }
}
