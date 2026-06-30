import { NotificationError } from '@/libs/exceptions';
import { sendNotification } from '@/services/notification';

vi.mock('@/config', async () => {
  process.env.CLOUDFLARE_API_TOKEN = 'test-api-token';
  process.env.CLOUDFLARE_ZONE_ID = 'test-zone-id';
  process.env.CLOUDFLARE_DNS_RECORD_ID = 'test-record-id';
  process.env.NTFY_TOPIC = 'test-topic';
  process.env.HOMEPAGE_URL = 'https://test.example.com';
  return await vi.importActual('@/config');
});

global.fetch = vi.fn();

describe('sendNotification', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('sends notification successfully', async () => {
    (fetch as vi.Mock).mockResolvedValue({ ok: true });
    await sendNotification('Test');
    expect(fetch).toHaveBeenCalledWith('https://ntfy.sh', {
      method: 'POST',
      body: JSON.stringify({
        topic: 'test-topic',
        message: 'Test',
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
  });

  it('throws NotificationError on network error', async () => {
    (fetch as vi.Mock).mockRejectedValue(new Error('Network error'));
    await expect(sendNotification('Test')).rejects.toThrow(NotificationError);
  });
});
