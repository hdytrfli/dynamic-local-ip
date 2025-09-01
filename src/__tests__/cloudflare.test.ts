import { CloudflareError } from '@/libs/exceptions';
import { logger } from '@/libs/logger';
import { updateCloudflare } from '@/services/cloudflare';

// Mock the logger
vi.mock('@/libs/logger', () => {
  return {
    logger: {
      info: vi.fn(),
      error: vi.fn(),
    },
  };
});

// Mock the config values
vi.mock('@/config', async () => {
  const actual = await vi.importActual('@/config');
  return {
    ...actual,
    CLOUDFLARE_EMAIL: 'test@example.com',
    CLOUDFLARE_DOMAIN: 'test.example.com',
    CLOUDFLARE_ZONE_ID: 'test-zone-id',
    CLOUDFLARE_API_KEY: 'test-api-key',
    CLOUDFLARE_DNS_RECORD_ID: 'test-record-id',
    NTFY_TOPIC: 'test-topic',
    HOMEPAGE_URL: 'https://test.example.com',
  };
});

// Mock fetch
global.fetch = vi.fn();

describe('Cloudflare Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('updateCloudflare', () => {
    it('should return true when update is successful', async () => {
      (fetch as vi.Mock).mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({ success: true }),
      });

      const result = await updateCloudflare('127.0.0.1');
      expect(result).toBe(true);
      expect(logger.info).toHaveBeenCalledWith(
        { domain: 'test.example.com', ip: '127.0.0.1' },
        'Updating Cloudflare'
      );
      expect(fetch).toHaveBeenCalledWith(
        'https://api.cloudflare.com/client/v4/zones/test-zone-id/dns_records/test-record-id',
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'X-Auth-Email': 'test@example.com',
            'X-Auth-Key': 'test-api-key',
          },
          body: JSON.stringify({
            type: 'A',
            ttl: 3600,
            content: '127.0.0.1',
            name: 'test.example.com',
            proxied: false,
          }),
        }
      );
    });

    it('should return false when update fails', async () => {
      (fetch as vi.Mock).mockResolvedValue({
        ok: false,
        json: vi.fn().mockResolvedValue({ success: false }),
      });

      const result = await updateCloudflare('127.0.0.1');
      expect(result).toBe(false);
      // The function doesn't log an error when the response is not ok but success is false
      // So we don't expect logger.error to be called in this case
    });

    it('should throw CloudflareError on network errors', async () => {
      (fetch as vi.Mock).mockRejectedValue(new Error('Network error'));

      await expect(updateCloudflare('127.0.0.1')).rejects.toThrow(
        CloudflareError
      );
      expect(logger.error).toHaveBeenCalled();
    });
  });
});
