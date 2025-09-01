import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import { logger } from '@/libs/logger';
import { EMPTY, SPACE } from '@/libs/constant';
import { IPDetectionError } from '@/libs/exceptions';

const execAsync = promisify(exec);

/**
 * Gets the local IP address of the machine
 */
export const getLocalIP = async (): Promise<string> => {
  try {
    const { stdout } = await execAsync('hostname --all-ip-addresses');
    const ips = stdout.trim().split(SPACE);

    for (const ip of ips) {
      if (ip && !ip.startsWith('127.')) {
        return ip;
      }
    }

    return ips[0] || EMPTY;
  } catch (error: unknown) {
    logger.error({ error }, 'Error getting local IP');
    if (error instanceof Error) {
      throw new IPDetectionError(error.message);
    }
    throw new IPDetectionError('Unknown error');
  }
};
