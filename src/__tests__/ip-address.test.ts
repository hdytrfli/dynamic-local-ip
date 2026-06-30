import { networkInterfaces } from 'node:os';
import { IPDetectionError } from '@/libs/exceptions';
import { getLocalIpAddress } from '@/libs/ip';

vi.mock('node:os', () => ({ networkInterfaces: vi.fn() }));

describe('getLocalIpAddress', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns first non-loopback IPv4', async () => {
    (networkInterfaces as any).mockReturnValue({
      eth0: [
        { address: '127.0.0.1', family: 'IPv4', internal: true },
        { address: '10.0.0.1', family: 'IPv4', internal: false },
      ],
    });
    expect(await getLocalIpAddress()).toBe('10.0.0.1');
  });

  it('returns first non-loopback across multiple interfaces', async () => {
    (networkInterfaces as any).mockReturnValue({
      lo: [{ address: '127.0.0.1', family: 'IPv4', internal: true }],
      eth0: [{ address: '10.0.0.1', family: 'IPv4', internal: false }],
      wlan0: [{ address: '192.168.1.100', family: 'IPv4', internal: false }],
    });
    expect(await getLocalIpAddress()).toBe('10.0.0.1');
  });

  it('falls back to loopback when no non-loopback found', async () => {
    (networkInterfaces as any).mockReturnValue({
      lo: [{ address: '127.0.0.1', family: 'IPv4', internal: true }],
    });
    expect(await getLocalIpAddress()).toBe('127.0.0.1');
  });

  it('returns empty string when no IP found', async () => {
    (networkInterfaces as any).mockReturnValue({});
    expect(await getLocalIpAddress()).toBe('');
  });

  it('throws IPDetectionError on failure', async () => {
    (networkInterfaces as any).mockImplementation(() => {
      throw new Error('Boom');
    });
    await expect(getLocalIpAddress()).rejects.toThrow(IPDetectionError);
  });
});
