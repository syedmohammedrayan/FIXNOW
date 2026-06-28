import { BookingIntelligenceService } from '@/features/intelligent-booking/service';
import * as bookingFixture from '../fixtures/booking.fixture.json';
import * as diagnosisFixture from '../fixtures/diagnosis.fixture.json';

// Mock dependencies
jest.mock('@/features/intelligent-booking/service', () => ({
  BookingIntelligenceService: {
    generateBookingPlan: jest.fn()
  }
}));

describe('Booking Intelligence Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should successfully map a diagnosis to a booking plan', async () => {
    (BookingIntelligenceService.generateBookingPlan as jest.Mock).mockResolvedValue(bookingFixture);

    const result = await BookingIntelligenceService.generateBookingPlan(diagnosisFixture);
    
    expect(result.recommendedTechnician).toBe('HVAC');
    expect(result.priority).toBe('High');
    expect(result.toolsRequired.length).toBeGreaterThan(0);
    expect(BookingIntelligenceService.generateBookingPlan).toHaveBeenCalledWith(diagnosisFixture);
  });

  it('should handle edge cases where diagnosis data is sparse', async () => {
    const sparseDiagnosis = { problem: 'Unknown issue', urgency: 'Low' };
    
    (BookingIntelligenceService.generateBookingPlan as jest.Mock).mockResolvedValue({
      recommendedTechnician: 'General',
      priority: 'Low',
      toolsRequired: ['Basic toolkit']
    });

    const result = await BookingIntelligenceService.generateBookingPlan(sparseDiagnosis as any);
    expect(result.recommendedTechnician).toBe('General');
  });
});
