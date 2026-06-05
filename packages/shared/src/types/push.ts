// ─── Push Notification Types ──────────────────────────────────────────────────

export type PushEventType = 'achievement_unlocked' | 'level_up' | 'streak_reminder';

export type PushPermissionStatus = 'unsupported' | 'denied' | 'default' | 'subscribed';

export interface PushSubscriptionPayload {
  endpoint: string;
  keys: { p256dh: string; auth: string };
  userAgent?: string;
}

export interface PushNotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data: {
    url: string;
    type: PushEventType;
    [key: string]: unknown;
  };
}

export interface PushPreferences {
  achievements: boolean;
  levelUp: boolean;
  streakReminder: boolean;
}
