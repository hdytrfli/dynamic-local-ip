import { config } from 'dotenv';
import { EnvSchema } from '@/config/schema';

config({
  quiet: true
});

const env = EnvSchema.parse(process.env);

export const {
  CLOUDFLARE_API_TOKEN,
  CLOUDFLARE_DOMAIN,
  CLOUDFLARE_ZONE_ID,
  CLOUDFLARE_DNS_RECORD_ID,
  NTFY_TOPIC,
  HOMEPAGE_URL,
  MAX_ATTEMPTS,
  COOLDOWN_PERIOD,
} = env;

export { DATA_FILE, EnvSchema } from '@/config/schema';
