/**
 * Universal Error Hierarchy
 * Never use throw new Error() inside AI.
 */

export class AIError extends Error {
  constructor(message: string, public readonly code: string, public readonly status: number = 500) {
    super(message);
    this.name = 'AIError';
  }
}

export class ValidationError extends AIError {
  constructor(message: string) {
    super(message, 'VALIDATION_ERROR', 400);
    this.name = 'ValidationError';
  }
}

export class RuntimeError extends AIError {
  constructor(message: string) {
    super(message, 'RUNTIME_ERROR', 500);
    this.name = 'RuntimeError';
  }
}

export class ProviderError extends AIError {
  constructor(message: string) {
    super(message, 'PROVIDER_ERROR', 502);
    this.name = 'ProviderError';
  }
}

export class MemoryError extends AIError {
  constructor(message: string) {
    super(message, 'MEMORY_ERROR', 500);
    this.name = 'MemoryError';
  }
}

export class TimeoutError extends AIError {
  constructor(message: string) {
    super(message, 'TIMEOUT_ERROR', 504);
    this.name = 'TimeoutError';
  }
}

export class AuthenticationError extends AIError {
  constructor(message: string) {
    super(message, 'AUTHENTICATION_ERROR', 401);
    this.name = 'AuthenticationError';
  }
}
