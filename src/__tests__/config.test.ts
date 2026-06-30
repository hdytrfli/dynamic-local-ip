import { EnvSchema } from '@/config';

describe('Configuration Validation', () => {
  it('should validate required fields', () => {
    const env = {
      CLOUDFLARE_API_TOKEN: 'token123',
      CLOUDFLARE_ZONE_ID: 'zone123',
      CLOUDFLARE_DNS_RECORD_ID: 'record123',
      NTFY_TOPIC: 'test-topic',
      HOMEPAGE_URL: 'https://test.example.com',
    };

    const result = EnvSchema.parse(env);
    expect(result.CLOUDFLARE_DNS_RECORD_ID).toEqual(['record123']);
  });

  it('should validate multiple comma-separated record IDs', () => {
    const env = {
      CLOUDFLARE_API_TOKEN: 'token123',
      CLOUDFLARE_ZONE_ID: 'zone123',
      CLOUDFLARE_DNS_RECORD_ID: 'record123, record456',
      NTFY_TOPIC: 'test-topic',
      HOMEPAGE_URL: 'https://test.example.com',
    };

    const result = EnvSchema.parse(env);
    expect(result.CLOUDFLARE_DNS_RECORD_ID).toEqual(['record123', 'record456']);
  });

  it('should reject missing required fields', () => {
    const invalidEnv = {
      NTFY_TOPIC: 'test-topic',
      HOMEPAGE_URL: 'https://test.example.com',
    };

    expect(() => EnvSchema.parse(invalidEnv)).toThrow();
  });

  it('should accept optional IP_RANGE', () => {
    const env = {
      CLOUDFLARE_API_TOKEN: 'token123',
      CLOUDFLARE_ZONE_ID: 'zone123',
      CLOUDFLARE_DNS_RECORD_ID: 'record123',
      NTFY_TOPIC: 'test-topic',
      HOMEPAGE_URL: 'https://test.example.com',
      IP_RANGE: '192.168.0.0/24',
    };

    const result = EnvSchema.parse(env);
    expect(result.IP_RANGE).toBe('192.168.0.0/24');
  });

  it('should use default values for optional fields', () => {
    const env = {
      CLOUDFLARE_API_TOKEN: 'token123',
      CLOUDFLARE_ZONE_ID: 'zone123',
      CLOUDFLARE_DNS_RECORD_ID: 'record123',
      NTFY_TOPIC: 'test-topic',
      HOMEPAGE_URL: 'https://test.example.com',
    };

    const result = EnvSchema.parse(env);

    expect(Number(result.MAX_ATTEMPTS)).toBe(3);
    expect(Number(result.COOLDOWN_PERIOD)).toBe(15 * 60 * 1000);
  });
});
