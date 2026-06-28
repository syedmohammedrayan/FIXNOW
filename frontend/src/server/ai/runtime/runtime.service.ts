import { IRuntimeService } from './runtime.interface';
import { AIRequest } from '../interfaces/request';
import { AIResponse } from '../interfaces/response';
import { RuntimeExecutionConfig } from './runtime.types';
import { RuntimePolicy } from './runtime.policy';
import { RuntimeSelector } from './runtime.selector';
import { RetryPolicy } from './runtime.retry';
import { TimeoutPolicy } from './runtime.timeout';
import { MetricsCollector } from './runtime.metrics';
import { RuntimeError } from '../gateway/gateway.errors';

export class RuntimeService implements IRuntimeService {
  
  async execute(request: AIRequest, config?: RuntimeExecutionConfig): Promise<AIResponse> {
    const startTime = Date.now();
    const executionConfig = config || RuntimePolicy.getDefaults();
    
    // 1. Budget limits check (stubbed)
    if (!RuntimePolicy.checkBudgetLimit(request.userId)) {
      throw new RuntimeError('User has exceeded AI budget quota.');
    }

    // 2. Select Provider and Model
    let currentProvider = RuntimeSelector.selectProvider(executionConfig);
    let currentModel = RuntimeSelector.selectModel(currentProvider, executionConfig);
    
    let isSuccess = false;
    let finalError: any;
    let response: AIResponse | null = null;
    let retriesUsed = 0;

    try {
      // 3. Retry Policy Wrapper
      response = await RetryPolicy.execute(async (attempt) => {
        retriesUsed = attempt - 1;
        
        try {
          // 4. Timeout Policy Wrapper
          const executionPromise = currentProvider.generate(request, { model: currentModel });
          return await TimeoutPolicy.execute(executionPromise, executionConfig.timeoutMs!);
        } catch (error) {
          // Fallback provider hook on failure (before throwing back to RetryPolicy)
          if (attempt < executionConfig.maxRetries!) {
            currentProvider = RuntimeSelector.getFallbackProvider(currentProvider.name);
            currentModel = RuntimeSelector.selectModel(currentProvider, executionConfig);
          }
          throw error;
        }
      }, executionConfig.maxRetries!);

      isSuccess = true;
      return response;

    } catch (error: any) {
      finalError = error;
      throw new RuntimeError(`Runtime execution failed completely after ${retriesUsed} retries: ${error.message}`);
    } finally {
      // 5. Always collect metrics
      MetricsCollector.record({
        requestId: request.requestId,
        provider: currentProvider.name,
        model: currentModel,
        startTime,
        endTime: Date.now(),
        latency: Date.now() - startTime,
        success: isSuccess,
        retryCount: retriesUsed,
        error: finalError?.message
      });
    }
  }
}
