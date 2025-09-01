import { EnvSchema } from '@/config/schema';

describe('Configuration Validation', () => {
  it('should validate correct environment variables', () => {
    const validEnv = {
      CLOUDFLARE_EMAIL: 'test@example.com',
      CLOUDFLARE_DOMAIN: 'example.com',
      CLOUDFLARE_ZONE_ID: 'zone123',
      CLOUDFLARE_API_KEY: 'api123',
      CLOUDFLARE_DNS_RECORD_ID: 'record123',
      NTFY_TOPIC: 'test-topic',
      HOMEPAGE_URL: 'https://test.example.com',
    };

    expect(() => EnvSchema.parse(validEnv)).not.toThrow();
  });

  it('should reject invalid email', () => {
    const invalidEnv = {
      CLOUDFLARE_EMAIL: 'invalid-email',
      CLOUDFLARE_DOMAIN: 'example.com',
      CLOUDFLARE_ZONE_ID: 'zone123',
      CLOUDFLARE_API_KEY: 'api123',
      CLOUDFLARE_DNS_RECORD_ID: 'record123',
      NTFY_TOPIC: 'test-topic',
      HOMEPAGE_URL: 'https://test.example.com',
    };

    expect(() => EnvSchema.parse(invalidEnv)).toThrow();
  });

  it('should reject missing required fields', () => {
    const invalidEnv = {
      CLOUDFLARE_EMAIL: 'test@example.com',
      // Missing other required fields
    };

    expect(() => EnvSchema.parse(invalidEnv)).toThrow();
  });

  it('should use default values for optional fields', () => {
    const env = {
      CLOUDFLARE_EMAIL: 'test@example.com',
      CLOUDFLARE_DOMAIN: 'example.com',
      CLOUDFLARE_ZONE_ID: 'zone123',
      CLOUDFLARE_API_KEY: 'api123',
      CLOUDFLARE_DNS_RECORD_ID: 'record123',
      NTFY_TOPIC: 'test-topic',
      HOMEPAGE_URL: 'https://test.example.com',
      // No optional fields provided
    };

    const result = EnvSchema.parse(env);

    // Optional fields should have default values
    expect(Number(result.MAX_ATTEMPTS)).toBe(3);
    expect(Number(result.COOLDOWN_PERIOD)).toBe(15 * 60 * 1000);
  });
});
