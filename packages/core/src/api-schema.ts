import { z } from 'zod';

export const jobStatusSchema = z.enum(['queued', 'processing', 'done', 'failed']);
export type JobStatus = z.infer<typeof jobStatusSchema>;

export const createJobResponseSchema = z.object({
  jobId: z.string(),
  jobToken: z.string(),
  status: jobStatusSchema,
  expiresAt: z.string(),
});
export type CreateJobResponse = z.infer<typeof createJobResponseSchema>;

export const jobOutputFileSchema = z.object({
  index: z.number().int().positive(),
  totalSegments: z.number().int().positive(),
  durationSec: z.number().nonnegative(),
  sizeBytes: z.number().int().positive(),
  downloadUrl: z.string().url(),
});
export type JobOutputFile = z.infer<typeof jobOutputFileSchema>;

export const getJobStatusResponseSchema = z.object({
  jobId: z.string(),
  status: jobStatusSchema,
  progressRatio: z.number().min(0).max(1),
  outputs: z.array(jobOutputFileSchema),
  error: z.string().optional(),
});
export type GetJobStatusResponse = z.infer<typeof getJobStatusResponseSchema>;

