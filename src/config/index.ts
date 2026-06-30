import * as dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config({
  quiet: true,
});

const split = (value: string) => {
  return value
    .split(',')
    .map((string) => string.trim())
    .filter(Boolean);
};

export const EnvSchema = z.object({
  CLOUDFLARE_API_TOKEN: z.string().min(1),
  CLOUDFLARE_ZONE_ID: z.string().min(1),
  CLOUDFLARE_DNS_RECORD_ID: z
    .string()
    .min(1)
    .transform(split)
    .refine((arr) => arr.length > 0, {
      message: 'At least one DNS record ID is required',
    }),
  IP_RANGE: z.string().optional(),
  NTFY_TOPIC: z.string().min(1),
  HOMEPAGE_URL: z.url(),
  MAX_ATTEMPTS: z.coerce.number().min(1).optional().default(3),
  COOLDOWN_PERIOD: z.coerce
    .number()
    .min(1)
    .optional()
    .default(15 * 60 * 1000),
  STABILITY_PERIOD: z.coerce.number().min(0).optional().default(60_000),
});

export const env = EnvSchema.parse(process.env);
