/**
 * Mock implementation of CascadeFlow.
 */
export const mockCascadeFlow = {
  createGraph: () => ({
    addNode: () => {},
    addEdge: () => {},
    compile: () => ({
      execute: async (context: any) => ({
        ...context,
        __mockExecuted: true,
        finalOutput: {
          status: 'success',
          mockResult: true
        }
      })
    })
  })
};
