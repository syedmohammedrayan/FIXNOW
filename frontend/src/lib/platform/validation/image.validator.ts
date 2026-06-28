import { z } from 'zod';
import { validateSchema } from './schema.validator';

export const imageUploadSchema = z.object({
  imageUrl: z.string().url('Must be a valid URL'),
  mimeType: z.string().regex(/^image\/(jpeg|png|webp)$/, 'Must be a JPEG, PNG, or WEBP image'),
  sizeBytes: z.number().max(10 * 1024 * 1024, 'Image must be under 10MB'),
  userId: z.string().min(1, 'User ID is required')
});

export type ImageUploadPayload = z.infer<typeof imageUploadSchema>;

export function validateImageUpload(data: unknown): ImageUploadPayload {
  return validateSchema(imageUploadSchema, data);
}
