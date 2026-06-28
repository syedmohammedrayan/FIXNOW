/**
 * Mock implementation of Groq responses.
 */
export const mockGroqProvider = {
  chat: async (options: any) => {
    return {
      id: 'mock-chat-id',
      choices: [
        {
          message: {
            content: JSON.stringify({
              status: 'success',
              mockResponse: true
            })
          }
        }
      ]
    };
  }
};
