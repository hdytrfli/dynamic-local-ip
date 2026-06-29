import Cloudflare, { APIError } from 'cloudflare';
import {
  CLOUDFLARE_API_TOKEN,
  CLOUDFLARE_DOMAIN,
  CLOUDFLARE_ZONE_ID,
  CLOUDFLARE_DNS_RECORD_ID,
} from '@/config';
import { logger } from '@/libs/logger';
import { CloudflareError } from '@/libs/exceptions';

const client = new Cloudflare({ apiToken: CLOUDFLARE_API_TOKEN });

/**
 * Updates the Cloudflare DNS record with the provided IP
 */
export const updateCloudflare = async (ip: string): Promise<boolean> => {
  logger.info({ domain: CLOUDFLARE_DOMAIN, ip }, 'Updating Cloudflare');

  try {
    await client.dns.records.update(CLOUDFLARE_DNS_RECORD_ID, {
      zone_id: CLOUDFLARE_ZONE_ID,
      type: 'A',
      ttl: 3600,
      content: ip,
      name: CLOUDFLARE_DOMAIN,
      proxied: false,
    });

    logger.info({ ip }, 'Cloudflare update successful');
    return true;
  } catch (error: unknown) {
    logger.error({ error }, 'Error updating Cloudflare');
    if (error instanceof APIError) {
      return false;
    }
    if (error instanceof Error) {
      throw new CloudflareError(error.message);
    }
    throw new CloudflareError('Unknown error');
  }
};
