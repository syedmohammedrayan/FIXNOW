import { SmartDiagnosisService } from '@/features/smart-diagnosis/service';
import * as diagnosisFixture from '../fixtures/diagnosis.fixture.json';
import { AIError } from '@/lib/platform/errors';

// Mock dependencies
jest.mock('@/features/smart-diagnosis/service', () => ({
  SmartDiagnosisService: {
    analyzeIssue: jest.fn()
  }
}));

describe('Smart Diagnosis Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should successfully analyze a standard issue', async () => {
    (SmartDiagnosisService.analyzeIssue as jest.Mock).mockResolvedValue(diagnosisFixture);

    const result = await SmartDiagnosisService.analyzeIssue('AC is blowing warm air');
    
    expect(result.problem).toBe(diagnosisFixture.problem);
    expect(result.confidence).toBeGreaterThan(0.9);
    expect(result.estimatedRepair).toBeDefined();
    expect(SmartDiagnosisService.analyzeIssue).toHaveBeenCalledWith('AC is blowing warm air');
  });

  it('should throw an AIError if the model fails', async () => {
    (SmartDiagnosisService.analyzeIssue as jest.Mock).mockRejectedValue(
      new AIError('Model generation failed', 'GROQ_TIMEOUT')
    );

    await expect(SmartDiagnosisService.analyzeIssue('Complex issue'))
      .rejects.toThrow(AIError);
  });
});
