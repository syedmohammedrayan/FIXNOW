/**
 * Global test setup executed before all tests.
 */

// Mock standard environment variables
process.env.NEXT_PUBLIC_FF_VOICE_ENABLED = 'true';
process.env.NEXT_PUBLIC_FF_OCR_ENABLED = 'true';

// Mock timers if needed, or global objects
// jest.useFakeTimers();
