import { NotificationError } from '@/libs/exceptions';
import { logger } from '@/libs/logger';
import { sendNotification } from '@/services/notification';

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

describe('Notification Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('sendNotification', () => {
    it('should send notification successfully', async () => {
      (fetch as vi.Mock).mockResolvedValue({
        ok: true,
      });

      const message = 'Test notification';
      await sendNotification(message);

      expect(fetch).toHaveBeenCalledWith('https://ntfy.sh', {
        method: 'POST',
        body: JSON.stringify({
          topic: 'test-topic',
          message: message,
          actions: [
            {
              action: 'view',
              label: 'Open Homepage',
              url: 'https://test.example.com',
              clear: true,
            },
          ],
        }),
      });
      expect(logger.info).toHaveBeenCalledWith(
        { message },
        'Notification sent'
      );
    });

    it('should throw NotificationError on network errors', async () => {
      (fetch as vi.Mock).mockRejectedValue(new Error('Network error'));

      const message = 'Test notification';
      await expect(sendNotification(message)).rejects.toThrow(
        NotificationError
      );
      expect(logger.error).toHaveBeenCalled();
    });
  });
});
