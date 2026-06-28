import { OrchestrationService } from '@/features/orchestration/service';
import { FixNowAIService } from '@/lib/ai/service';
import { HindsightMemoryService } from '@/lib/ai/memory/service';
import * as diagnosisFixture from '../fixtures/diagnosis.fixture.json';
import * as bookingFixture from '../fixtures/booking.fixture.json';

jest.mock('@/lib/ai/service', () => ({
  FixNowAIService: {
    generateStructuredOutput: jest.fn()
  }
}));

jest.mock('@/lib/ai/memory/service', () => ({
  HindsightMemoryService: {
    recall: jest.fn(),
    retain: jest.fn().mockResolvedValue({ success: true, id: 'mem-123' })
  }
}));

describe('E2E: Customer Journey Lifecycle', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should successfully complete the entire lifecycle from issue reporting to predictive maintenance', async () => {
    const userId = 'customer-999';
    const applianceId = 'appliance-wash-01';

    // =========================================================================
    // PHASE 1: CUSTOMER REPORTS ISSUE
    // =========================================================================
    
    // Setup Phase 1 Mocks
    (HindsightMemoryService.recall as jest.Mock).mockResolvedValueOnce([]); // No past memory
    (FixNowAIService.generateStructuredOutput as jest.Mock)
      .mockResolvedValueOnce(diagnosisFixture) // Diagnosis
      .mockResolvedValueOnce(bookingFixture)   // Booking
      .mockResolvedValueOnce({                 // Copilot Work Plan
        stepByStepGuide: ['Drain water', 'Replace rods'],
        safetyHazards: ['Electrical', 'Heavy lifting'],
        partsToCarry: ['Suspension rods']
      });

    const reportIssueRequest = {
      trigger: 'customer_issue',
      userId,
      sessionId: 'session-1',
      problemText: 'Washing machine is shaking violently during spin cycle'
    };

    const phase1Result = await OrchestrationService.handleRequest(reportIssueRequest);
    
    expect(phase1Result.status).toBe('success');
    expect(phase1Result.data.diagnosis).toBeDefined();
    expect(phase1Result.data.booking).toBeDefined();
    expect(phase1Result.data.copilot).toBeDefined();

    // =========================================================================
    // PHASE 2: TECHNICIAN COMPLETES REPAIR
    // =========================================================================
    
    // Setup Phase 2 Mocks
    (FixNowAIService.generateStructuredOutput as jest.Mock).mockResolvedValueOnce({
      isResolved: true,
      technicianNotes: 'Replaced all 4 suspension rods.',
      customerAdvice: 'Do not overload the machine.'
    });

    const repairLogRequest = {
      trigger: 'technician_repair_log',
      userId: 'tech-001',
      sessionId: 'session-2',
      bookingId: 'booking-abc',
      repairNotes: 'Changed the suspension rods, tested spin cycle, works fine.'
    };

    const phase2Result = await OrchestrationService.handleRequest(repairLogRequest);

    expect(phase2Result.status).toBe('success');
    expect(phase2Result.data.outcome.isResolved).toBe(true);
    
    // Verify Hindsight actually saved the memory!
    expect(HindsightMemoryService.retain).toHaveBeenCalledWith(
      userId, 
      expect.stringContaining('Replaced all 4 suspension rods')
    );

    // =========================================================================
    // PHASE 3: ADMIN RUNS PREDICTIVE MAINTENANCE
    // =========================================================================
    
    // Setup Phase 3 Mocks
    // Memory now recalls the previous repair!
    (HindsightMemoryService.recall as jest.Mock).mockResolvedValueOnce([
      'Past Repair: Replaced all 4 suspension rods.'
    ]);
    
    (FixNowAIService.generateStructuredOutput as jest.Mock).mockResolvedValueOnce({
      healthScore: 85,
      failureProbability: 'Low',
      estimatedDaysToFailure: 365,
      warningSigns: ['None']
    });

    const predictiveRequest = {
      trigger: 'predictive_maintenance_check',
      userId: 'admin-1',
      sessionId: 'session-3',
      applianceId
    };

    const phase3Result = await OrchestrationService.handleRequest(predictiveRequest);

    expect(phase3Result.status).toBe('success');
    expect(phase3Result.data.maintenance.healthScore).toBe(85);
    expect(phase3Result.data.maintenance.failureProbability).toBe('Low');
    
    // Verify memory was queried to inform the prediction
    expect(HindsightMemoryService.recall).toHaveBeenCalledWith(
      applianceId,
      expect.any(String)
    );
  });
});
