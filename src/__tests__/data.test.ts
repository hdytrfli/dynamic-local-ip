import { promises as fs } from 'node:fs';
import { readData, writeData } from '@/libs/data';
import { DataError } from '@/libs/exceptions';
import { logger } from '@/libs/logger';
import type { Data } from '@/libs/types';

// Mock the logger
vi.mock('@/libs/logger', () => {
  return {
    logger: {
      error: vi.fn(),
    },
  };
});

// Mock the config values
vi.mock('@/config', async () => {
  process.env.CLOUDFLARE_API_TOKEN = 'test-api-token';
  process.env.CLOUDFLARE_DOMAIN = 'test.example.com';
  process.env.CLOUDFLARE_ZONE_ID = 'test-zone-id';
  process.env.CLOUDFLARE_DNS_RECORD_ID = 'test-record-id';
  process.env.NTFY_TOPIC = 'test-topic';
  process.env.HOMEPAGE_URL = 'https://test.example.com';
  const actual = await vi.importActual('@/config');
  return actual;
});

// Mock fs
vi.mock('node:fs', () => {
  return {
    existsSync: vi.fn(() => true),
    promises: {
      readFile: vi.fn(),
      writeFile: vi.fn(),
      mkdir: vi.fn(),
    },
  };
});

describe('Data Utility', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('readData', () => {
    it('should return default data when file does not exist', async () => {
      (fs.readFile as any).mockRejectedValue({ code: 'ENOENT' });

      const data = await readData();
      expect(data).toEqual({
        attempt_count: 0,
        current_ip: null,
        last_updated: null,
        last_error: null,
        is_error: false,
      });
      expect(logger.error).not.toHaveBeenCalled();
    });

    it('should return data from file when it exists', async () => {
      const mockData: Data = {
        attempt_count: 1,
        current_ip: '127.0.0.1',
        last_updated: '2023-01-01T00:00:00.000Z',
        last_error: null,
        is_error: false,
      };

      (fs.readFile as any).mockResolvedValue(JSON.stringify(mockData));

      const data = await readData();
      expect(data).toEqual(mockData);
    });

    it('should return default data and log error when file reading fails', async () => {
      const error = new Error('File read error');
      (error as any).code = 'EACCES'; // Some other error code
      (fs.readFile as any).mockRejectedValue(error);

      const data = await readData();
      expect(data).toEqual({
        attempt_count: 0,
        current_ip: null,
        last_updated: null,
        last_error: null,
        is_error: false,
      });
      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe('writeData', () => {
    it('should write data to file successfully', async () => {
      (fs.writeFile as any).mockResolvedValue(undefined);

      const testData: Data = {
        attempt_count: 1,
        current_ip: '127.0.0.1',
        last_updated: '2023-01-01T00:00:00.000Z',
        last_error: null,
        is_error: false,
      };

      await writeData(testData);
      expect(fs.writeFile).toHaveBeenCalledWith(
        'data/cache.json',
        JSON.stringify(testData, null, 2)
      );
    });

    it('should throw DataError when write fails', async () => {
      (fs.writeFile as any).mockRejectedValue(new Error('Write error'));

      const testData: Data = {
        attempt_count: 1,
        current_ip: '127.0.0.1',
        last_updated: '2023-01-01T00:00:00.000Z',
        last_error: null,
        is_error: false,
      };

      await expect(writeData(testData)).rejects.toThrow(DataError);
      expect(logger.error).toHaveBeenCalled();
    });
  });
});
