import webpush from 'web-push';

let initialized = false;

function init(): void {
  if (initialized) return;

  const subject = process.env.VAPID_SUBJECT;
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;

  if (!subject || !publicKey || !privateKey) {
    throw new Error('[webPush] Missing VAPID_SUBJECT / VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY in env');
  }
  if (!subject.startsWith('mailto:')) {
    throw new Error('[webPush] VAPID_SUBJECT must be a mailto: URI');
  }

  webpush.setVapidDetails(subject, publicKey, privateKey);
  initialized = true;
}

export const webPushClient = {
  sendNotification: (...args: Parameters<typeof webpush.sendNotification>) => {
    init();
    return webpush.sendNotification(...args);
  },
  generateVAPIDKeys: webpush.generateVAPIDKeys,
};
