import { APIError } from 'cloudflare';
import { CloudflareError } from '@/libs/exceptions';
import { updateCloudflare } from '@/services/cloudflare';

const mockUpdate = vi.hoisted(() => vi.fn());

vi.mock('cloudflare', () => {
  class MockAPIError extends Error {
    constructor(message: string) {
      super(message);
      this.name = 'APIError';
    }
  }
  return {
    default: vi.fn(() => ({
      dns: { records: { update: mockUpdate } },
    })),
    APIError: MockAPIError,
  };
});

vi.mock('@/config', async () => {
  process.env.CLOUDFLARE_API_TOKEN = 'test-api-token';
  process.env.CLOUDFLARE_ZONE_ID = 'test-zone-id';
  process.env.CLOUDFLARE_DNS_RECORD_ID = 'test-record-id';
  process.env.NTFY_TOPIC = 'test-topic';
  process.env.HOMEPAGE_URL = 'https://test.example.com';
  return await vi.importActual('@/config');
});

describe('updateCloudflare', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns true when all updates succeed', async () => {
    mockUpdate.mockResolvedValue({});
    expect(await updateCloudflare('127.0.0.1')).toBe(true);
    expect(mockUpdate).toHaveBeenCalledWith('test-record-id', {
      zone_id: 'test-zone-id',
      type: 'A',
      ttl: 3600,
      content: '127.0.0.1',
      name: 'test-record-id',
      proxied: false,
    });
  });

  it('returns false when an API error occurs', async () => {
    mockUpdate.mockRejectedValue(
      new APIError(400, undefined, 'Bad request', undefined as never)
    );
    expect(await updateCloudflare('127.0.0.1')).toBe(false);
  });

  it('throws CloudflareError on unexpected errors', async () => {
    mockUpdate.mockRejectedValue(new Error('Network error'));
    await expect(updateCloudflare('127.0.0.1')).rejects.toThrow(
      CloudflareError
    );
  });
});
