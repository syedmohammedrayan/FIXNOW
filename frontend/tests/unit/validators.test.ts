import { validateOrchestrationRequest } from '@/lib/platform/validation/request.validator';
import { validateImageUpload } from '@/lib/platform/validation/image.validator';
import { ValidationError } from '@/lib/platform/errors/ValidationError';
import * as requestFixtures from '../fixtures/requests.fixture.json';

describe('Validation Layer', () => {
  describe('Orchestration Request Validator', () => {
    it('should validate a correct customer issue request', () => {
      const payload = requestFixtures.validCustomerIssue;
      const result = validateOrchestrationRequest(payload);
      expect(result.trigger).toBe('customer_issue');
      expect(result.problemText).toBeDefined();
    });

    it('should reject a request missing required input fields', () => {
      const payload = requestFixtures.invalidMissingInput;
      expect(() => validateOrchestrationRequest(payload)).toThrow(ValidationError);
      
      try {
        validateOrchestrationRequest(payload);
      } catch (error: any) {
        expect(error).toBeInstanceOf(ValidationError);
        expect(error.validationErrors.length).toBeGreaterThan(0);
      }
    });

    it('should accept admin_review triggers without problem/image inputs', () => {
      const payload = {
        trigger: 'admin_review',
        userId: 'admin-1',
        sessionId: 'session-1'
      };
      const result = validateOrchestrationRequest(payload);
      expect(result.trigger).toBe('admin_review');
    });
  });

  describe('Image Upload Validator', () => {
    it('should validate correct image payload', () => {
      const payload = {
        imageUrl: 'https://example.com/image.jpg',
        mimeType: 'image/jpeg',
        sizeBytes: 1024 * 500, // 500KB
        userId: 'user-123'
      };
      const result = validateImageUpload(payload);
      expect(result.imageUrl).toBe(payload.imageUrl);
    });

    it('should reject oversized images', () => {
      const payload = {
        imageUrl: 'https://example.com/image.jpg',
        mimeType: 'image/jpeg',
        sizeBytes: 15 * 1024 * 1024, // 15MB (> 10MB limit)
        userId: 'user-123'
      };
      expect(() => validateImageUpload(payload)).toThrow(ValidationError);
    });
  });
});
