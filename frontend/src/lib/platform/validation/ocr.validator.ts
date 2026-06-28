import { z } from 'zod';
import { validateSchema } from './schema.validator';

export const ocrDocumentSchema = z.object({
  documentUrl: z.string().url('Must be a valid URL'),
  mimeType: z.string().regex(/^(image\/(jpeg|png)|application\/pdf)$/, 'Must be a JPEG, PNG, or PDF document'),
  sizeBytes: z.number().max(15 * 1024 * 1024, 'Document must be under 15MB'),
  userId: z.string().min(1, 'User ID is required')
});

export type OCRDocumentPayload = z.infer<typeof ocrDocumentSchema>;

export function validateOCRDocument(data: unknown): OCRDocumentPayload {
  return validateSchema(ocrDocumentSchema, data);
}
