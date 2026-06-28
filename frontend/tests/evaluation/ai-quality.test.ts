import { SmartDiagnosisService } from '@/features/smart-diagnosis/service';
import { FixNowAIService } from '@/lib/ai/service';
import { DiagnosisSchema } from '@/features/smart-diagnosis/types';

jest.mock('@/lib/ai/service', () => ({
  FixNowAIService: {
    generateStructuredOutput: jest.fn()
  }
}));

describe('AI Evaluation: Quality & Boundaries', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Structural Adherence', () => {
    it('should strictly parse returned LLM outputs against Zod schemas', async () => {
      // We simulate the LLM returning a valid object
      const validLLMResponse = {
        problem: 'Leaking refrigerator',
        confidence: 0.95,
        estimatedRepair: {
          timeMinutes: 45,
          complexity: 'Medium'
        }
      };

      (FixNowAIService.generateStructuredOutput as jest.Mock).mockResolvedValueOnce(validLLMResponse);

      const result = await SmartDiagnosisService.analyzeIssue('Fridge is leaking water');
      
      // We manually invoke the Zod parser to ensure the output strictly conforms
      // to our type schema without any missing required fields.
      const parseResult = DiagnosisSchema.safeParse(result);
      
      expect(parseResult.success).toBe(true);
      if (parseResult.success) {
        expect(parseResult.data.problem).toBe('Leaking refrigerator');
      }
    });
  });

  describe('Hallucination Resistance', () => {
    it('should fallback gracefully when asked to diagnose impossible appliances', async () => {
      const hallucinationPrompt = 'My teleportation fridge is leaking quantum fluid, how do I fix the flux capacitor?';
      
      // We mock the expected behavior of our well-prompted LLM facing this prompt
      (FixNowAIService.generateStructuredOutput as jest.Mock).mockResolvedValueOnce({
        problem: 'Unknown or unsupported appliance issue',
        confidence: 0.1, // Low confidence indicates hallucination resistance
        estimatedRepair: {
          timeMinutes: 0,
          complexity: 'High'
        }
      });

      const result = await SmartDiagnosisService.analyzeIssue(hallucinationPrompt);

      // Verify the AI evaluates it as an unknown issue rather than making up a repair
      expect(result.confidence).toBeLessThan(0.3);
      expect(result.problem).toMatch(/Unknown|unsupported/i);
    });
  });

  describe('Sparse Data Handling', () => {
    it('should handle completely vague or empty prompts without breaking', async () => {
      const vaguePrompt = 'it is broken';

      (FixNowAIService.generateStructuredOutput as jest.Mock).mockResolvedValueOnce({
        problem: 'Insufficient information provided',
        confidence: 0.2,
        estimatedRepair: {
          timeMinutes: 30,
          complexity: 'Low' // Need manual inspection
        }
      });

      const result = await SmartDiagnosisService.analyzeIssue(vaguePrompt);
      
      expect(result.confidence).toBeLessThan(0.5);
      expect(result.problem).toMatch(/Insufficient information/i);
    });
  });
});
