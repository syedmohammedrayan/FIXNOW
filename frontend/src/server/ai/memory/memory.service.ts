import { IMemoryService } from './memory.interface';
import { AIRequest } from '../interfaces/request';

export class DummyMemoryService implements IMemoryService {
  async buildContext(request: AIRequest): Promise<any[]> {
    // Return empty context or dummy history
    return [...request.messages];
  }

  async saveContext(request: AIRequest, responseContent: string): Promise<void> {
    // Dummy save
    return;
  }
}
