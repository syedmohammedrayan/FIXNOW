import { AIRequest } from '../interfaces/request';
import { AIResponse } from '../interfaces/response';
import { IMemoryService } from '../memory/memory.interface';
import { IRuntimeService } from '../runtime/runtime.interface';

export class OrchestratorService {
  constructor(
    private readonly memory: IMemoryService,
    private readonly runtime: IRuntimeService
  ) {}

  async processRequest(request: AIRequest): Promise<AIResponse> {
    // 1. Build AI context (Memory)
    const contextMessages = await this.memory.buildContext(request);
    
    // Inject memory context into the request before sending it to the runtime
    request.messages = contextMessages;

    // 2. Invoke Runtime Engine (Provider selection is now hidden inside runtime)
    const response = await this.runtime.execute(request);

    // 3. Save Context (Memory)
    await this.memory.saveContext(request, response.content);

    return response;
  }
}
