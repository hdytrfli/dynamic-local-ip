import { networkInterfaces } from 'node:os';
import { EMPTY } from '@/libs/constant';
import { IPDetectionError } from '@/libs/exceptions';
import { logger } from '@/libs/logger';

/**
 * Gets the local IP address of the machine
 */
export const getLocalIP = async (): Promise<string> => {
  try {
    const nets = networkInterfaces();

    for (const interfaceName of Object.keys(nets)) {
      const interfaces = nets[interfaceName];
      if (!interfaces) continue;

      for (const iface of interfaces) {
        if (iface.internal || iface.family !== 'IPv4') continue;
        if (iface.address && !iface.address.startsWith('127.')) {
          return iface.address;
        }
      }
    }

    for (const interfaceName of Object.keys(nets)) {
      const interfaces = nets[interfaceName];
      if (!interfaces) continue;

      for (const iface of interfaces) {
        if (iface.family === 'IPv4') {
          return iface.address || EMPTY;
        }
      }
    }

    return EMPTY;
  } catch (error: unknown) {
    logger.error({ error }, 'Error getting local IP');
    if (error instanceof Error) throw new IPDetectionError(error.message);
    throw new IPDetectionError('Unknown error');
  }
};
