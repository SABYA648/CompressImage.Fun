import { z } from 'zod';

const envSchema = z.object({
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  FILE_TTL_SECONDS: z.coerce.number().int().min(60).default(14_400),
  TEMP_STORAGE_DIR: z.string().default('/data/jobs'),
  PROCESS_CONCURRENCY: z.coerce.number().int().min(1).max(8).default(2),
  SHARP_CONCURRENCY: z.coerce.number().int().min(1).max(8).default(2),
  MAX_UPLOAD_BYTES: z.coerce.number().int().min(1).default(104_857_600),
  MAX_BATCH_BYTES: z.coerce.number().int().min(1).default(524_288_000),
  MAX_BATCH_FILES: z.coerce.number().int().min(1).max(200).default(50),
  MAX_IMAGE_PIXELS: z.coerce.number().int().min(1).default(100_000_000),
  MAX_ANIMATION_FRAMES: z.coerce.number().int().min(1).default(500),
  PROCESS_TIMEOUT_MS: z.coerce.number().int().min(1_000).default(60_000),
  MIN_FREE_DISK_BYTES: z.coerce.number().int().min(0).default(1_073_741_824),
});

export const config = envSchema.parse(process.env);
