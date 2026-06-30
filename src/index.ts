import { schedule } from 'node-cron';
import { getLocalIpAddress } from '@/libs/ip';
import { log } from '@/libs/logger';
import { store } from '@/libs/state';
import {
  inCooldown,
  isOutOfRange,
  isUnchanged,
  isWaitingForStability,
  shouldMonitor,
} from '@/libs/utils';
import { loadRecordNames, updateCloudflare } from '@/services/cloudflare';
import { sendNotification } from '@/services/notification';

let recordNames: string[] = [];

const cloudflareUpdate = async (ip: string) => {
  const snapshot = store.snapshot();

  try {
    const success = await updateCloudflare(ip, recordNames);

    if (success) {
      store.update({
        currentIp: ip,
        lastUpdated: new Date().toISOString(),
        attemptCount: 0,
        lastError: new Date().toISOString(),
        isError: false,
        pendingIp: null,
      });
    } else {
      store.update({
        attemptCount: snapshot.attemptCount + 1,
        lastError: new Date().toISOString(),
        isError: true,
      });
    }

    return success;
  } catch (error) {
    store.update({
      attemptCount: snapshot.attemptCount + 1,
      lastError: new Date().toISOString(),
      isError: true,
    });

    throw error;
  }
};

schedule('* * * * *', async () => {
  if (recordNames.length === 0) recordNames = await loadRecordNames();

  try {
    const ipAddress = await getLocalIpAddress();
    const currentState = store.snapshot();

    if (isUnchanged(ipAddress, currentState)) {
      return log.debug({
        event: 'ip.unchanged',
      });
    }

    if (isOutOfRange(ipAddress)) {
      store.set('pendingIp', null);

      return log.info({
        event: 'range.skip',
        ipAddress: ipAddress,
      });
    }

    log.info({
      event: 'ip.change',
      ipAddress: ipAddress,
      from: currentState.currentIp,
      error: currentState.isError,
    });

    if (inCooldown(currentState)) {
      return log.info({
        event: 'cooldown',
      });
    }

    if (isWaitingForStability(ipAddress, currentState)) {
      return log.info({
        event: 'stable.wait',
        ipAddress: ipAddress,
      });
    }

    if (shouldMonitor(ipAddress, currentState)) {
      store.update({
        pendingIp: ipAddress,
        pendingSince: Date.now(),
      });

      return log.info({
        event: 'stable.start',
        ipAddress: ipAddress,
      });
    }

    const success = await cloudflareUpdate(ipAddress);
    log.info({
      ipAddress: ipAddress,
      event: success ? 'cloudflare.ok' : 'cloudflare.fail',
      attempts: store.get('attemptCount'),
    });

    if (success) await sendNotification('IP updated to ' + ipAddress);
    else await sendNotification('Update failed ' + store.get('attemptCount'));
  } catch (error) {
    log.error({ event: 'error', error });
    if (error instanceof Error) {
      await sendNotification('Error: ' + error.message);
    }
  }
});

log.info({ event: 'start' });
