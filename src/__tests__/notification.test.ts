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

describe('sendNotification', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('sends notification successfully', async () => {
    const mock = vi
      .spyOn(global, 'fetch')
      .mockResolvedValue({ ok: true } as any);

    await sendNotification('Test');
    expect(mock).toHaveBeenCalledWith('https://ntfy.sh', {
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
    vi.spyOn(global, 'fetch').mockRejectedValue(new Error('Network error'));
    await expect(sendNotification('Test')).rejects.toThrow(NotificationError);
  });
});
