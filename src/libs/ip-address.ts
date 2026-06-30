import { type NetworkInterfaceInfo, networkInterfaces } from 'node:os';
import { IPDetectionError } from '@/libs/exceptions';

const ipAddressToInteger = (ipAddress: string) => {
  return (
    ipAddress
      .split('.')
      .reduce((acc, octet) => (acc << 8) + Number.parseInt(octet, 10), 0) >>> 0
  );
};

export const isAddressInRange = (ip: string, range: string) => {
  const [base, bits] = range.split('/');
  const mask = ~0 << (32 - Number.parseInt(bits, 10));
  return (ipAddressToInteger(ip) & mask) === (ipAddressToInteger(base) & mask);
};

const isValidIpAddress = (iface: NetworkInterfaceInfo) => {
  if (iface.internal) return false;
  if (iface.family !== 'IPv4') return false;
  if (!iface.address) return false;
  if (iface.address.startsWith('127.')) return false;
  return true;
};

export const getLocalIpAddress = async (): Promise<string> => {
  try {
    const nets = networkInterfaces();
    let ipAddress = '';
    let complete = false;

    Object.values(nets).forEach((list) => {
      if (!list || complete) return;

      list.forEach((iface) => {
        if (complete) return;

        const valid = isValidIpAddress(iface);
        if (!valid) return;

        ipAddress = iface.address;
        complete = true;
      });
    });

    if (ipAddress) return ipAddress;
    Object.values(nets).forEach((list) => {
      if (!list || complete) return;
      list.forEach((iface) => {
        if (complete) return;
        if (iface.family === 'IPv4') {
          ipAddress = iface.address || '';
          complete = true;
        }
      });
    });

    return ipAddress;
  } catch (error: unknown) {
    if (error instanceof Error) throw new IPDetectionError(error.message);
    throw new IPDetectionError('Unknown error');
  }
};
