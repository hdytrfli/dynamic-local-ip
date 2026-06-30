import { APIError } from 'cloudflare';

const mockGet = vi.hoisted(() => vi.fn());
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
      dns: {
        records: {
          get: mockGet,
          update: mockUpdate,
        },
      },
    })),
    APIError: MockAPIError,
  };
});

const setupConfig = () => {
  process.env.CLOUDFLARE_API_TOKEN = 'test-api-token';
  process.env.CLOUDFLARE_ZONE_ID = 'test-zone-id';
  process.env.CLOUDFLARE_DNS_RECORD_ID = 'test-record-id';
  process.env.NTFY_TOPIC = 'test-topic';
  process.env.HOMEPAGE_URL = 'https://test.example.com';
};

describe('updateCloudflare', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    setupConfig();
  });

  it('uses provided names', async () => {
    mockUpdate.mockResolvedValue({});

    const { updateCloudflare } = await import('@/services/cloudflare');

    expect(await updateCloudflare('127.0.0.1', ['test.example.com'])).toBe(
      true
    );
    expect(mockUpdate).toHaveBeenCalledWith('test-record-id', {
      zone_id: 'test-zone-id',
      type: 'A',
      ttl: 3600,
      content: '127.0.0.1',
      name: 'test.example.com',
      proxied: false,
    });
  });

  it('falls back to recordId when name is missing', async () => {
    mockUpdate.mockResolvedValue({});

    const { updateCloudflare } = await import('@/services/cloudflare');

    expect(await updateCloudflare('127.0.0.1', [])).toBe(true);
    expect(mockUpdate).toHaveBeenCalledWith('test-record-id', {
      zone_id: 'test-zone-id',
      type: 'A',
      ttl: 3600,
      content: '127.0.0.1',
      name: 'test-record-id',
      proxied: false,
    });
  });

  it('returns false when an API error occurs on update', async () => {
    mockUpdate.mockRejectedValue(
      new APIError(400, undefined, 'Bad request', undefined as never)
    );

    const { updateCloudflare } = await import('@/services/cloudflare');
    expect(await updateCloudflare('127.0.0.1', ['test.example.com'])).toBe(
      false
    );
  });

  it('throws on unexpected update errors', async () => {
    mockUpdate.mockRejectedValue(new Error('Network error'));

    const { updateCloudflare } = await import('@/services/cloudflare');
    await expect(
      updateCloudflare('127.0.0.1', ['test.example.com'])
    ).rejects.toThrow('Cloudflare error');
  });

  it('loadRecordNames fetches names from Cloudflare', async () => {
    mockGet.mockResolvedValue({ name: 'test.example.com' });

    const { loadRecordNames } = await import('@/services/cloudflare');

    const names = await loadRecordNames();
    expect(names).toEqual(['test.example.com']);
    expect(mockGet).toHaveBeenCalledWith('test-record-id', {
      zone_id: 'test-zone-id',
    });
  });

  it('loadRecordNames throws when fetch fails', async () => {
    mockGet.mockRejectedValue(
      new APIError(404, undefined, 'Not found', undefined as never)
    );

    const { loadRecordNames } = await import('@/services/cloudflare');
    await expect(loadRecordNames()).rejects.toThrow(
      'Failed to fetch record names'
    );
  });
});
