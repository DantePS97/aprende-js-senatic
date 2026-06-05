import { z } from 'zod';

// ─── Push Subscription Schemas ────────────────────────────────────────────────

export const pushSubscribeSchema = z.object({
  endpoint: z.string().url(),
  keys: z.object({
    p256dh: z.string().min(1),
    auth: z.string().min(1),
  }),
  userAgent: z.string().max(512).optional(),
});

export const pushUnsubscribeSchema = z.object({
  endpoint: z.string().url(),
});

export const updatePushPreferencesSchema = z.object({
  achievements: z.boolean().optional(),
  levelUp: z.boolean().optional(),
  streakReminder: z.boolean().optional(),
});

export type PushSubscribeInput = z.infer<typeof pushSubscribeSchema>;
export type PushUnsubscribeInput = z.infer<typeof pushUnsubscribeSchema>;
export type UpdatePushPreferencesInput = z.infer<typeof updatePushPreferencesSchema>;
