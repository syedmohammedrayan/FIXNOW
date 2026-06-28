import { OrchestrationService } from '@/features/orchestration/service';
import { FixNowAIService } from '@/lib/ai/service';
import { HindsightMemoryService } from '@/lib/ai/memory/service';
import * as diagnosisFixture from '../fixtures/diagnosis.fixture.json';
import * as bookingFixture from '../fixtures/booking.fixture.json';

// Mock the boundaries
jest.mock('@/lib/ai/service', () => ({
  FixNowAIService: {
    generateStructuredOutput: jest.fn()
  }
}));

jest.mock('@/lib/ai/memory/service', () => ({
  HindsightMemoryService: {
    recall: jest.fn().mockResolvedValue(['Past issue: AC leakage']),
    retain: jest.fn().mockResolvedValue({ success: true })
  }
}));

describe('Integration: Orchestration Pipeline', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should successfully chain Multimodal -> Diagnosis -> Booking -> Copilot', async () => {
    // 1. Setup boundary mocks
    // First AI call inside DiagnosisService
    (FixNowAIService.generateStructuredOutput as jest.Mock).mockResolvedValueOnce(diagnosisFixture);
    // Second AI call inside BookingIntelligenceService
    (FixNowAIService.generateStructuredOutput as jest.Mock).mockResolvedValueOnce(bookingFixture);
    // Third AI call inside TechnicianCopilotService
    (FixNowAIService.generateStructuredOutput as jest.Mock).mockResolvedValueOnce({
      stepByStepGuide: ['Inspect', 'Repair'],
      safetyHazards: ['Electrical'],
      partsToCarry: ['Coolant']
    });

    // 2. Execute pipeline via Orchestrator
    const request = {
      trigger: 'customer_issue',
      userId: 'user-789',
      sessionId: 'session-xyz',
      problemText: 'My AC is blowing warm air'
    };

    const result = await OrchestrationService.handleRequest(request);

    // 3. Verify Workflow Chaining
    expect(result.status).toBe('success');
    expect(result.workflow).toBe('customer_issue');
    expect(result.data).toBeDefined();
    
    // Ensure the data passed through the chain correctly
    expect(result.data.diagnosis.problem).toBe(diagnosisFixture.problem);
    expect(result.data.booking.recommendedTechnician).toBe(bookingFixture.recommendedTechnician);
    expect(result.data.copilot.partsToCarry).toContain('Coolant');

    // 4. Verify boundary interactions
    expect(HindsightMemoryService.recall).toHaveBeenCalled();
    expect(FixNowAIService.generateStructuredOutput).toHaveBeenCalledTimes(3);
  });
});
