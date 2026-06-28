export const cascadeConfig = {
  mode: process.env.CASCADEFLOW_MODE || 'observe', // observe, enforce, off
  provider: process.env.AI_PROVIDER || 'groq',
  defaultModels: {
    drafter: 'meta-llama/llama-4-scout-17b-16e-instruct', // cheap, fast
    verifier: process.env.DEFAULT_MODEL || 'meta-llama/llama-4-scout-17b-16e-instruct', // powerful
  }
};
