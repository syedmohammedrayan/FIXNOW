import { z } from 'zod';
import { validateSchema } from './schema.validator';

export const voiceUploadSchema = z.object({
  audioUrl: z.string().url('Must be a valid URL'),
  mimeType: z.string().regex(/^audio\/(mpeg|wav|webm|ogg)$/, 'Must be an MP3, WAV, WEBM, or OGG audio file'),
  durationSeconds: z.number().max(120, 'Voice recording cannot exceed 120 seconds'),
  sizeBytes: z.number().max(5 * 1024 * 1024, 'Audio must be under 5MB'),
  userId: z.string().min(1, 'User ID is required')
});

export type VoiceUploadPayload = z.infer<typeof voiceUploadSchema>;

export function validateVoiceUpload(data: unknown): VoiceUploadPayload {
  return validateSchema(voiceUploadSchema, data);
}
