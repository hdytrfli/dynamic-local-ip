import { config } from 'dotenv';
import { EnvSchema } from './schema';

process.env.DOTENV_CONFIG_QUIET = 'true';
config();

const env = EnvSchema.parse(process.env);

export const {
  CLOUDFLARE_EMAIL,
  CLOUDFLARE_DOMAIN,
  CLOUDFLARE_ZONE_ID,
  CLOUDFLARE_API_KEY,
  CLOUDFLARE_DNS_RECORD_ID,
  NTFY_TOPIC,
  HOMEPAGE_URL,
  MAX_ATTEMPTS,
  COOLDOWN_PERIOD,
} = env;

// Export the hardcoded data file path
export { DATA_FILE } from './schema';
export { EnvSchema } from './schema';
