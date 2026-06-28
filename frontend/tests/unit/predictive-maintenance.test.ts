import { PredictiveMaintenanceService } from '@/features/predictive-maintenance/service';

// Mock dependencies
jest.mock('@/features/predictive-maintenance/service', () => ({
  PredictiveMaintenanceService: {
    analyzeHealth: jest.fn()
  }
}));

describe('Predictive Maintenance Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should analyze appliance health and predict failure timeline', async () => {
    const mockHealthProfile = {
      healthScore: 45,
      failureProbability: 'High',
      estimatedDaysToFailure: 15,
      warningSigns: ['Compressor noise', 'Increased energy usage']
    };
    
    (PredictiveMaintenanceService.analyzeHealth as jest.Mock).mockResolvedValue(mockHealthProfile);

    const result = await PredictiveMaintenanceService.analyzeHealth('appliance-123', [
      'Repair history: Replaced capacitor',
      'Current Issue: Vibrating sound'
    ]);
    
    expect(result.healthScore).toBeLessThan(50);
    expect(result.failureProbability).toBe('High');
    expect(result.estimatedDaysToFailure).toBe(15);
  });
});
