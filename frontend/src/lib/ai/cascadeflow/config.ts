export const cascadeConfig = {
  mode: process.env.CASCADEFLOW_MODE || 'observe', // observe, enforce, off
  provider: process.env.AI_PROVIDER || 'groq',
  defaultModels: {
    drafter: 'groq/compound', // cheap, fast
    verifier: process.env.DEFAULT_MODEL || 'groq/compound', // powerful
  }
};
