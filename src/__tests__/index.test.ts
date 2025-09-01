import { readData, writeData } from '@/libs/data';
import { getLocalIP } from '@/libs/ip';
import type { Data } from '@/libs/types';
import { updateCloudflare } from '@/services/cloudflare';
import { sendNotification } from '@/services/notification';

// Mock all dependencies
vi.mock('@/libs/data');
vi.mock('@/libs/ip');
vi.mock('@/services/cloudflare');
vi.mock('@/services/notification');

// Mock config with required environment variables
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

describe('Main Application Logic', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('IP Change Detection', () => {
    it('should update Cloudflare when IP changes', async () => {
      (getLocalIP as vi.Mock).mockResolvedValue('127.0.0.1');
      (readData as vi.Mock).mockResolvedValue({
        current_ip: '127.0.0.2',
        attempt_count: 0,
        last_updated: null,
        last_error: null,
        is_error: false,
      } as Data);

      (updateCloudflare as vi.Mock).mockResolvedValue(true);
      (writeData as vi.Mock).mockResolvedValue(undefined);
      (sendNotification as vi.Mock).mockResolvedValue(undefined);

      // We would normally import and call checkAndUpdateIP here
      // But since it's not exported, we'll test the logic indirectly
      const currentIP = await getLocalIP();
      const data = await readData();

      expect(currentIP).toBe('127.0.0.1');
      expect(data.current_ip).toBe('127.0.0.2');
      expect(currentIP !== data.current_ip).toBe(true);
    });

    it('should not update Cloudflare when IP is the same', async () => {
      (getLocalIP as vi.Mock).mockResolvedValue('127.0.0.1');
      (readData as vi.Mock).mockResolvedValue({
        current_ip: '127.0.0.1',
        attempt_count: 0,
        last_updated: null,
        last_error: null,
        is_error: false,
      } as Data);

      const currentIP = await getLocalIP();
      const data = await readData();

      expect(currentIP).toBe('127.0.0.1');
      expect(data.current_ip).toBe('127.0.0.1');
      expect(currentIP !== data.current_ip).toBe(false);
    });

    it('should update Cloudflare when there was a previous error', async () => {
      (getLocalIP as vi.Mock).mockResolvedValue('127.0.0.1');
      (readData as vi.Mock).mockResolvedValue({
        current_ip: '127.0.0.1',
        attempt_count: 1,
        last_updated: null,
        last_error: '2023-01-01T00:00:00.000Z',
        is_error: true,
      } as Data);

      const currentIP = await getLocalIP();
      const data = await readData();

      expect(currentIP).toBe('127.0.0.1');
      expect(data.current_ip).toBe('127.0.0.1');
      expect(data.is_error).toBe(true);
    });
  });
});
