import { HindsightMemoryService } from '@/lib/ai/memory/service';
import { mockHindsight } from '../mocks/hindsight.mock';

// Mock dependencies
jest.mock('@/lib/ai/memory/service', () => ({
  HindsightMemoryService: {
    recall: jest.fn(),
    retain: jest.fn()
  }
}));

describe('Memory Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Recall Operations', () => {
    it('should successfully recall memory using Hindsight', async () => {
      const mockMemories = ["Mock memory 1", "Mock memory 2"];
      (HindsightMemoryService.recall as jest.Mock).mockResolvedValue(mockMemories);

      const result = await HindsightMemoryService.recall('user-123', 'AC leakage');
      
      expect(result.length).toBe(2);
      expect(result[0]).toBe('Mock memory 1');
      expect(HindsightMemoryService.recall).toHaveBeenCalledWith('user-123', 'AC leakage');
    });

    it('should gracefully handle empty recall results', async () => {
      (HindsightMemoryService.recall as jest.Mock).mockResolvedValue([]);
      
      const result = await HindsightMemoryService.recall('user-123', 'Unknown problem');
      expect(result.length).toBe(0);
    });
  });

  describe('Retain Operations', () => {
    it('should correctly format and retain memory', async () => {
      (HindsightMemoryService.retain as jest.Mock).mockResolvedValue({ success: true, id: 'mem-1' });

      const result = await HindsightMemoryService.retain('user-123', 'Fixed AC leakage');
      
      expect(result.success).toBe(true);
      expect(result.id).toBe('mem-1');
    });
  });
});
