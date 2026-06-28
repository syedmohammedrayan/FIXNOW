import { TechnicianCopilotService } from '@/features/technician-copilot/service';

// Mock dependencies
jest.mock('@/features/technician-copilot/service', () => ({
  TechnicianCopilotService: {
    generateWorkPlan: jest.fn(),
    analyzeOutcome: jest.fn()
  }
}));

describe('Technician Copilot Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should generate a detailed work plan based on booking and diagnosis', async () => {
    const mockWorkPlan = {
      stepByStepGuide: ['Step 1', 'Step 2'],
      safetyHazards: ['Electrical shock'],
      partsToCarry: ['Capacitor', 'Refrigerant']
    };
    (TechnicianCopilotService.generateWorkPlan as jest.Mock).mockResolvedValue(mockWorkPlan);

    const result = await TechnicianCopilotService.generateWorkPlan('booking-123', 'diag-456');
    
    expect(result.partsToCarry).toContain('Capacitor');
    expect(result.safetyHazards.length).toBeGreaterThan(0);
  });

  it('should analyze repair outcome and return semantic summary', async () => {
    const mockOutcome = {
      isResolved: true,
      technicianNotes: 'Replaced run capacitor.',
      customerAdvice: 'Clean filter monthly.'
    };
    (TechnicianCopilotService.analyzeOutcome as jest.Mock).mockResolvedValue(mockOutcome);

    const result = await TechnicianCopilotService.analyzeOutcome('Fixed by replacing capacitor.');
    
    expect(result.isResolved).toBe(true);
    expect(result.customerAdvice).toBeDefined();
  });
});
