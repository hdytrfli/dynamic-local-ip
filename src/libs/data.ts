import { promises as fs } from 'node:fs';
import { DATA_FILE } from '@/config';
import { logger } from '@/libs/logger';
import type { Data } from '@/libs/types';
import { DataError } from '@/libs/exceptions';

/**
 * Reads the data file and returns its content
 */
export const readData = async (): Promise<Data> => {
  try {
    const data = await fs.readFile(DATA_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error: unknown) {
    if (error instanceof Error) {
      if ('code' in error && error.code !== 'ENOENT') {
        logger.error({ error }, 'Error reading data file');
      }
    }
  }

  return {
    attempt_count: 0,
    current_ip: null,
    last_updated: null,
    last_error: null,
    is_error: false,
  };
};

/**
 * Writes data to the data file
 */
export const writeData = async (data: Data): Promise<void> => {
  try {
    await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2));
  } catch (error: unknown) {
    logger.error({ error }, 'Error writing data file');
    if (error instanceof Error) {
      throw new DataError(error.message);
    }
    throw new DataError('Unknown error');
  }
};
