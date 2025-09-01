import { schedule } from 'node-cron';
import { COOLDOWN_PERIOD, MAX_ATTEMPTS } from '@/config';
import { logger } from '@/libs/logger';
import { readData, writeData } from '@/libs/data';
import { getLocalIP } from '@/libs/ip';
import type { Data } from '@/libs/types';
import { updateCloudflare } from '@/services/cloudflare';
import { sendNotification } from '@/services/notification';

/**
 * Creates a notification message based on the data
 */
const createNotificationMessage = (data: Data): string => {
  return data.is_error
    ? `Failed to update IP. Attempts: ${data.attempt_count}. Last error: ${data.last_error}`
    : `Current IP: ${data.current_ip}. Last updated: ${data.last_updated}`;
};

/**
 * Checks the current IP and updates Cloudflare if needed
 */
const checkAndUpdateIP = async () => {
  try {
    const currentIP = await getLocalIP();
    const data = await readData();

    if (currentIP !== data.current_ip || data.is_error) {
      logger.info(
        { currentIP, storedIP: data.current_ip, errorFlag: data.is_error },
        'IP change detected or previous error'
      );

      try {
        const success = await updateCloudflare(currentIP);

        if (success) {
          data.current_ip = currentIP;
          data.last_updated = new Date().toISOString();
          data.attempt_count = 0;
          data.last_error = null;
          data.is_error = false;
        } else {
          data.attempt_count += 1;
          data.last_error = new Date().toISOString();
          data.is_error = true;
        }
      } catch (error) {
        data.attempt_count += 1;
        data.last_error = new Date().toISOString();
        data.is_error = true;
        logger.error({ error }, 'Error updating Cloudflare');
      }

      await writeData(data);
      await sendNotification(createNotificationMessage(data));
    } else {
      logger.debug('No IP change detected');
    }
  } catch (error: unknown) {
    logger.error({ error }, 'Error in IP check and update');
    try {
      let errorMessage = 'Unknown error';
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      await sendNotification(`Application error: ${errorMessage}`);
    } catch (notificationError) {
      logger.error({ notificationError }, 'Failed to send error notification');
    }
  }
};

schedule('* * * * *', async () => {
  try {
    const data = await readData();
    const now = new Date();
    const parsed = data.last_error ? new Date(data.last_error) : null;
    const diff = parsed && now.getTime() - parsed.getTime();

    if (data.is_error) {
      if (data.attempt_count >= MAX_ATTEMPTS) {
        if (diff && diff < COOLDOWN_PERIOD) {
          logger.info('In cooldown period, skipping update');
          return;
        }
        data.attempt_count = 0;
        await writeData(data);
      }
    }

    await checkAndUpdateIP();
  } catch (error: unknown) {
    logger.error({ error }, 'Error in cron job');
  }
});

logger.info('Cloudflare IP updater started');
