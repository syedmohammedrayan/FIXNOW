import { Logger, LogLevel } from '@/lib/platform/logger/logger';
import { ErrorLogger } from '@/lib/platform/logger/error-logger';
import { AppError } from '@/lib/platform/errors';

describe('Logger Layer', () => {
  let consoleSpy: jest.SpyInstance;

  beforeEach(() => {
    // Spy on console methods to capture output
    consoleSpy = jest.spyOn(console, 'info').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'debug').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Base Logger', () => {
    it('should emit JSON formatted info logs', () => {
      Logger.info('Test event', { userId: '123' });
      
      expect(consoleSpy).toHaveBeenCalledTimes(1);
      const logString = consoleSpy.mock.calls[0][0];
      const logJson = JSON.parse(logString);
      
      expect(logJson.level).toBe(LogLevel.INFO);
      expect(logJson.message).toBe('Test event');
      expect(logJson.userId).toBe('123');
      expect(logJson.timestamp).toBeDefined();
    });
  });

  describe('ErrorLogger', () => {
    it('should format AppErrors with metadata', () => {
      const consoleErrorSpy = jest.spyOn(console, 'error');
      const error = new AppError('Custom test error', 'TEST_ERR', 400, true);
      
      ErrorLogger.logError(error, 'req-1', 'user-1');
      
      const logJson = JSON.parse(consoleErrorSpy.mock.calls[0][0]);
      expect(logJson.type).toBe('app_error');
      expect(logJson.code).toBe('TEST_ERR');
      expect(logJson.statusCode).toBe(400);
      expect(logJson.requestId).toBe('req-1');
    });

    it('should handle unhandled standard Errors', () => {
      const consoleErrorSpy = jest.spyOn(console, 'error');
      const error = new Error('Random crash');
      
      ErrorLogger.logError(error);
      
      const logJson = JSON.parse(consoleErrorSpy.mock.calls[0][0]);
      expect(logJson.type).toBe('unhandled_error');
      expect(logJson.message).toContain('Random crash');
    });
  });
});
