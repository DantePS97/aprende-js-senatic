import cron from 'node-cron';
import { sendStreakReminders } from '../services/notification.service';

export function setupNotificationCrons(): void {
  // Diario 6pm hora Colombia (UTC-5 = 23:00 UTC)
  cron.schedule('0 23 * * *', async () => {
    console.log('[cron/streak-reminder] Enviando recordatorios de racha...');
    await sendStreakReminders();
  }, { timezone: 'UTC' });

  console.log('[notifications] cron scheduled — daily 23:00 UTC');
}
