/**
 * Mock implementation of Firebase services.
 */
export const mockFirestore = {
  collection: (path: string) => ({
    doc: (id: string) => ({
      get: async () => ({
        exists: true,
        data: () => ({ id, mockData: true })
      }),
      set: async (data: any) => Promise.resolve(true),
      update: async (data: any) => Promise.resolve(true),
    }),
    add: async (data: any) => Promise.resolve({ id: 'mock-id' })
  })
};

export const mockAuth = {
  currentUser: {
    uid: 'mock-user-123',
    email: 'test@fixnow.com'
  }
};
