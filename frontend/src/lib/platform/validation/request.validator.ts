import { z } from 'zod';
import { validateSchema } from './schema.validator';

export const orchestrationRequestSchema = z.object({
  trigger: z.enum([
    'customer_issue',
    'image_upload',
    'voice_input',
    'document_upload',
    'technician_assigned',
    'repair_completed',
    'admin_review',
    'daily_summary',
    'weekly_summary'
  ]),
  userId: z.string().min(1, 'User ID is required'),
  sessionId: z.string().min(1, 'Session ID is required'),
  problemText: z.string().optional(),
  imageDescription: z.string().optional(),
  ocrText: z.string().optional(),
  layoutDescription: z.string().optional(),
  audioDescription: z.string().optional(),
  technicianId: z.string().optional(),
  jobId: z.string().optional(),
  metadata: z.record(z.string()).optional(),
}).refine(
  data => 
    !!data.problemText || 
    !!data.imageDescription || 
    !!data.ocrText || 
    !!data.audioDescription || 
    !!data.jobId ||
    data.trigger === 'admin_review' ||
    data.trigger === 'daily_summary' ||
    data.trigger === 'weekly_summary',
  {
    message: 'At least one input (problem, image, OCR, audio, or job ID) must be provided for non-admin workflows.',
    path: ['payload']
  }
);

export type OrchestrationRequestPayload = z.infer<typeof orchestrationRequestSchema>;

export function validateOrchestrationRequest(data: unknown): OrchestrationRequestPayload {
  return validateSchema(orchestrationRequestSchema, data);
}
