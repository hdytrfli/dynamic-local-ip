import {
  CLOUDFLARE_EMAIL,
  CLOUDFLARE_DOMAIN,
  CLOUDFLARE_ZONE_ID,
  CLOUDFLARE_API_KEY,
  CLOUDFLARE_DNS_RECORD_ID,
} from '@/config';
import { logger } from '@/libs/logger';
import { CloudflareError } from '@/libs/exceptions';

/**
 * Updates the Cloudflare DNS record with the provided IP
 */
export const updateCloudflare = async (ip: string): Promise<boolean> => {
  logger.info({ domain: CLOUDFLARE_DOMAIN, ip }, 'Updating Cloudflare');

  const url = `https://api.cloudflare.com/client/v4/zones/${CLOUDFLARE_ZONE_ID}/dns_records/${CLOUDFLARE_DNS_RECORD_ID}`;

  try {
    const response = await fetch(url, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'X-Auth-Email': CLOUDFLARE_EMAIL,
        'X-Auth-Key': CLOUDFLARE_API_KEY,
      },
      body: JSON.stringify({
        type: 'A',
        ttl: 3600,
        content: ip,
        name: CLOUDFLARE_DOMAIN,
        proxied: false,
      }),
    });

    const result = (await response.json()) as { success: boolean };
    logger.info({ result }, 'Cloudflare update result');
    return response.ok && result.success;
  } catch (error: unknown) {
    logger.error({ error }, 'Error updating Cloudflare');
    if (error instanceof Error) {
      throw new CloudflareError(error.message);
    }
    throw new CloudflareError('Unknown error');
  }
};
