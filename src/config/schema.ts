import { z } from 'zod';

export const EnvSchema = z.object({
  CLOUDFLARE_EMAIL: z.string().email(),
  CLOUDFLARE_DOMAIN: z.string().min(1),
  CLOUDFLARE_ZONE_ID: z.string().min(1),
  CLOUDFLARE_API_KEY: z.string().min(1),
  CLOUDFLARE_DNS_RECORD_ID: z.string().min(1),

  NTFY_TOPIC: z.string().min(1),
  HOMEPAGE_URL: z.string().url(),

  MAX_ATTEMPTS: z
    .string()
    .optional()
    .default('3')
    .transform(Number)
    .pipe(z.number().min(1)),

  COOLDOWN_PERIOD: z
    .string()
    .optional()
    .default(String(15 * 60 * 1000))
    .transform(Number)
    .pipe(z.number().min(1)),
});

// Hardcoded data file path
export const DATA_FILE = 'cache.json';
