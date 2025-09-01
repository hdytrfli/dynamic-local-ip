import { networkInterfaces } from 'node:os';
import { logger } from '@/libs/logger';
import { getLocalIP } from '@/libs/ip';
import { IPDetectionError } from '@/libs/exceptions';

// Mock the logger
vi.mock('@/libs/logger', () => {
  return {
    logger: {
      error: vi.fn(),
    },
  };
});

// Mock the config
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

// Mock os
vi.mock('node:os', () => {
  return {
    networkInterfaces: vi.fn(),
  };
});

describe('IP Utility', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getLocalIP', () => {
    it('should return the first non-loopback IP address', async () => {
      (networkInterfaces as any).mockReturnValue({
        eth0: [
          {
            address: '127.0.0.1',
            family: 'IPv4',
            internal: true,
          },
          {
            address: '10.0.0.1',
            family: 'IPv4',
            internal: false,
          },
        ],
      });

      const ip = await getLocalIP();
      expect(ip).toBe('10.0.0.1');
    });

    it('should return the first non-loopback IP address with multiple interfaces', async () => {
      (networkInterfaces as any).mockReturnValue({
        lo: [
          {
            address: '127.0.0.1',
            family: 'IPv4',
            internal: true,
          },
        ],
        eth0: [
          {
            address: '10.0.0.1',
            family: 'IPv4',
            internal: false,
          },
        ],
        wlan0: [
          {
            address: '192.168.1.100',
            family: 'IPv4',
            internal: false,
          },
        ],
      });

      const ip = await getLocalIP();
      expect(ip).toBe('10.0.0.1');
    });

    it('should return loopback IP as fallback when no non-loopback IP is found', async () => {
      (networkInterfaces as any).mockReturnValue({
        lo: [
          {
            address: '127.0.0.1',
            family: 'IPv4',
            internal: true,
          },
        ],
      });

      const ip = await getLocalIP();
      expect(ip).toBe('127.0.0.1');
    });

    it('should return empty string when no IP addresses are found', async () => {
      (networkInterfaces as any).mockReturnValue({});

      const ip = await getLocalIP();
      expect(ip).toBe('');
    });

    it('should throw IPDetectionError on failure', async () => {
      (networkInterfaces as any).mockImplementation(() => {
        throw new Error('Network interfaces error');
      });

      await expect(getLocalIP()).rejects.toThrow(IPDetectionError);
      expect(logger.error).toHaveBeenCalled();
    });
  });
});
