import { AIRequest } from '../interfaces/request';

export interface IMemoryService {
  buildContext(request: AIRequest): Promise<any[]>;
  saveContext(request: AIRequest, responseContent: string): Promise<void>;
}
