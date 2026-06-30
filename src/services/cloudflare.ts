import Cloudflare, { APIError } from 'cloudflare';
import { env } from '@/config';
import { CloudflareError } from '@/libs/exceptions';

const client = new Cloudflare({ apiToken: env.CLOUDFLARE_API_TOKEN });

export const updateCloudflare = async (ip: string): Promise<boolean> => {
  const results = await Promise.allSettled(
    env.CLOUDFLARE_DNS_RECORD_ID.map((recordId) =>
      client.dns.records.update(recordId, {
        zone_id: env.CLOUDFLARE_ZONE_ID,
        type: 'A',
        ttl: 3600,
        content: ip,
        name: recordId,
        proxied: false,
      })
    )
  );

  let complete = true;

  results.forEach((result) => {
    if (result.status === 'fulfilled') return;
    if (result.reason instanceof APIError) {
      complete = false;
    } else if (result.reason instanceof Error) {
      throw new CloudflareError(result.reason.message);
    } else {
      throw new CloudflareError('Unknown error');
    }
  });

  return complete;
};
