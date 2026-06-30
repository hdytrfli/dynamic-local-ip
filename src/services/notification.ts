import { env } from '@/config';
import { NotificationError } from '@/libs/exceptions';

export const sendNotification = async (message: string) => {
  try {
    await fetch('https://ntfy.sh', {
      method: 'POST',
      body: JSON.stringify({
        topic: env.NTFY_TOPIC,
        message,
        actions: [
          {
            action: 'view',
            label: 'Open Homepage',
            url: env.HOMEPAGE_URL,
            clear: true,
          },
        ],
      }),
    });
  } catch (error: unknown) {
    if (error instanceof Error) throw new NotificationError(error.message);
    throw new NotificationError('Unknown error');
  }
};
