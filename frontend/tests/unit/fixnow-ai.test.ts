import { FixNowAIService } from '@/lib/ai/service';
import { mockGroqProvider } from '../mocks/groq.mock';

// Mock dependencies
jest.mock('@/lib/ai/service', () => ({
  FixNowAIService: {
    generateStructuredOutput: jest.fn()
  }
}));

describe('FixNowAIService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should call generateStructuredOutput and return validated object', async () => {
    // Setup Mock Return
    (FixNowAIService.generateStructuredOutput as jest.Mock).mockResolvedValue({
      status: 'success',
      mockResponse: true
    });

    const result = await FixNowAIService.generateStructuredOutput('Some prompt', 'schema-name');
    
    expect(FixNowAIService.generateStructuredOutput).toHaveBeenCalledWith('Some prompt', 'schema-name');
    expect(result.status).toBe('success');
  });

  it('should properly bubble up API errors', async () => {
    // Setup Mock Rejection
    (FixNowAIService.generateStructuredOutput as jest.Mock).mockRejectedValue(new Error('API Timeout'));

    await expect(FixNowAIService.generateStructuredOutput('Prompt', 'schema'))
      .rejects.toThrow('API Timeout');
  });
});
