import { schedule } from 'node-cron';
import { log } from '@/libs/logger';
import { getLocalIpAddress } from '@/libs/ip';
import { updateCloudflare } from '@/services/cloudflare';
import { sendNotification } from '@/services/notification';
import { store } from '@/libs/state';
import {
  isUnchanged,
  isOutOfRange,
  shouldMonitor,
  inCooldown,
  isWaitingForStability,
} from '@/libs/utils';

const cloudflareUpdate = async (ip: string) => {
  const snapshot = store.snapshot();

  try {
    const success = await updateCloudflare(ip);

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
        ip: ipAddress,
      });
    }

    log.info({
      event: 'ip.change',
      ip: ipAddress,
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
        ip: ipAddress,
      });
    }

    if (shouldMonitor(ipAddress, currentState)) {
      store.update({ pendingIp: ipAddress, pendingSince: Date.now() });
      return log.info({
        event: 'stable.start',
        ip: ipAddress,
      });
    }

    const success = await cloudflareUpdate(ipAddress);

    log.info({
      ip: ipAddress,
      event: success ? 'cf.ok' : 'cf.fail',
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
