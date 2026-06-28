import { AIRequest } from '../interfaces/request';

export interface GatewayProcessOptions {
  skipAuth?: boolean;
}

export type GatewayInput = Partial<AIRequest>;
