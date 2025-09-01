import { NTFY_TOPIC, HOMEPAGE_URL } from '@/config';
import { logger } from '@/libs/logger';
import { NotificationError } from '@/libs/exceptions';

/**
 * Sends a notification via ntfy.sh
 */
export const sendNotification = async (message: string) => {
  try {
    await fetch('https://ntfy.sh', {
      method: 'POST',
      body: JSON.stringify({
        topic: NTFY_TOPIC,
        message: message,
        actions: [
          {
            action: 'view',
            label: 'Open Homepage',
            url: HOMEPAGE_URL,
            clear: true,
          },
        ],
      }),
    });

    logger.info({ message }, 'Notification sent');
  } catch (error: unknown) {
    logger.error({ error }, 'Error sending notification');
    if (error instanceof Error) {
      throw new NotificationError(error.message);
    }
    throw new NotificationError('Unknown error');
  }
};
