import { APIError } from 'cloudflare';
import { CloudflareError } from '@/libs/exceptions';
import { logger } from '@/libs/logger';
import { updateCloudflare } from '@/services/cloudflare';

const mockUpdate = vi.hoisted(() => vi.fn());

// Mock the cloudflare SDK
vi.mock('cloudflare', () => {
  class MockAPIError extends Error {
    constructor(message: string) {
      super(message);
      this.name = 'APIError';
    }
  }
  return {
    default: vi.fn(() => ({
      dns: {
        records: {
          update: mockUpdate,
        },
      },
    })),
    APIError: MockAPIError,
  };
});

// Mock the logger
vi.mock('@/libs/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock the config values
vi.mock('@/config', async () => {
  process.env.CLOUDFLARE_API_TOKEN = 'test-api-token';
  process.env.CLOUDFLARE_DOMAIN = 'test.example.com';
  process.env.CLOUDFLARE_ZONE_ID = 'test-zone-id';
  process.env.CLOUDFLARE_DNS_RECORD_ID = 'test-record-id';
  process.env.NTFY_TOPIC = 'test-topic';
  process.env.HOMEPAGE_URL = 'https://test.example.com';
  const actual = await vi.importActual('@/config');
  return actual;
});

describe('Cloudflare Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('updateCloudflare', () => {
    it('should return true when update is successful', async () => {
      mockUpdate.mockResolvedValue({} as never);

      const result = await updateCloudflare('127.0.0.1');
      expect(result).toBe(true);
      expect(logger.info).toHaveBeenCalledWith(
        { domain: 'test.example.com', ip: '127.0.0.1' },
        'Updating Cloudflare'
      );
      expect(mockUpdate).toHaveBeenCalledWith(
        'test-record-id',
        {
          zone_id: 'test-zone-id',
          type: 'A',
          ttl: 3600,
          content: '127.0.0.1',
          name: 'test.example.com',
          proxied: false,
        }
      );
    });

    it('should return false when update fails with API error', async () => {
      mockUpdate.mockRejectedValue(new APIError(400, undefined, 'Bad request', undefined as never));

      const result = await updateCloudflare('127.0.0.1');
      expect(result).toBe(false);
    });

    it('should throw CloudflareError on unexpected errors', async () => {
      mockUpdate.mockRejectedValue(new Error('Network error'));

      await expect(updateCloudflare('127.0.0.1')).rejects.toThrow(CloudflareError);
      expect(logger.error).toHaveBeenCalled();
    });
  });
});
