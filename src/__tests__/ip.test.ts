import { exec } from 'node:child_process';
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

// Mock child_process
vi.mock('node:child_process', () => {
  return {
    exec: vi.fn(),
  };
});

describe('IP Utility', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getLocalIP', () => {
    it('should return the first non-loopback IP address', async () => {
      (exec as any).mockImplementation(
        (_command: string, callback: (error: any, stdout: any) => void) => {
          callback(null, { stdout: '127.0.0.1 10.0.0.1' });
        }
      );

      const ip = await getLocalIP();
      expect(ip).toBe('10.0.0.1');
    });

    it('should return the first non-loopback IP address with multiple IPs', async () => {
      (exec as any).mockImplementation(
        (_command: string, callback: (error: any, stdout: any) => void) => {
          callback(null, { stdout: '127.0.0.1 10.0.0.1 192.168.1.100' });
        }
      );

      const ip = await getLocalIP();
      expect(ip).toBe('10.0.0.1');
    });

    it('should throw IPDetectionError on failure', async () => {
      (exec as any).mockImplementation(
        (_command: string, callback: (error: any, stdout: any) => void) => {
          callback(new Error('Command failed'), { stdout: '' });
        }
      );

      await expect(getLocalIP()).rejects.toThrow(IPDetectionError);
      expect(logger.error).toHaveBeenCalled();
    });
  });
});
