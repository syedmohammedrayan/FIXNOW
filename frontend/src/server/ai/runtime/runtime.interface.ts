import { AIRequest } from '../interfaces/request';
import { AIResponse } from '../interfaces/response';
import { RuntimeExecutionConfig } from './runtime.types';

/**
 * Runtime Engine Interface
 * 
 * The single entry point for executing AI requests after Orchestrator preparation.
 */
export interface IRuntimeService {
  execute(request: AIRequest, config?: RuntimeExecutionConfig): Promise<AIResponse>;
}
