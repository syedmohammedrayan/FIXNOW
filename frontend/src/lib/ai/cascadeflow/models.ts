import { cascadeConfig } from './config';

export const cascadeModels = [
  { 
    name: cascadeConfig.defaultModels.drafter, 
    provider: cascadeConfig.provider as any, 
    cost: 0.000375 // ~$0.375/1M tokens (Drafter)
  },
  { 
    name: cascadeConfig.defaultModels.verifier, 
    provider: cascadeConfig.provider as any, 
    cost: 0.00625  // ~$6.25/1M tokens (Verifier)
  }
];
