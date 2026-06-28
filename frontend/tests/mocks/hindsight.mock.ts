/**
 * Mock implementation of Hindsight Memory Service.
 */
export const mockHindsight = {
  recall: async (bankId: string, query: string, topK: number = 5) => {
    return [
      "Mock memory 1: Previously repaired a similar issue.",
      "Mock memory 2: Customer prefers weekend visits."
    ];
  },
  retain: async (bankId: string, text: string) => {
    return { success: true, id: 'mock-memory-id' };
  },
  delete: async (id: string) => {
    return { success: true };
  }
};
