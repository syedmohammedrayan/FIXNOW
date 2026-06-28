import { ZodSchema, ZodError } from 'zod';
import { ValidationError } from '../errors';

/**
 * Validates a payload against a Zod schema.
 * Throws a ValidationError if validation fails.
 */
export function validateSchema<T>(schema: ZodSchema<T>, data: unknown): T {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof ZodError) {
      throw new ValidationError(
        'Validation failed for the provided payload.',
        error.errors
      );
    }
    throw error;
  }
}
