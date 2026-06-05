// Push Notification Service — subscribe / unsubscribe / preferences / send

import mongoose from 'mongoose';
import { PushSubscription, IPushSubscription } from '../models/PushSubscription.model';
import { UserModel } from '../models/User.model';
import { webPushClient } from '../lib/webPush';
import type {
  PushSubscriptionPayload,
  PushNotificationPayload,
  PushPreferences,
  PushEventType,
} from '@senatic/shared';

// ─── subscribe ────────────────────────────────────────────────────────────────

export async function subscribe(userId: string, payload: PushSubscriptionPayload): Promise<void> {
  await PushSubscription.findOneAndUpdate(
    { endpoint: payload.endpoint },
    {
      $set: {
        userId: new mongoose.Types.ObjectId(userId),
        keys: payload.keys,
        userAgent: payload.userAgent,
      },
      $setOnInsert: { failureCount: 0 },
    },
    { upsert: true, new: true }
  );

  // Set push preferences defaults only if the sub-doc is absent
  await UserModel.findOneAndUpdate(
    { _id: new mongoose.Types.ObjectId(userId), 'preferences.push': { $exists: false } },
    {
      $set: {
        'preferences.push.achievements': true,
        'preferences.push.levelUp': true,
        'preferences.push.streakReminder': true,
      },
    }
  );
}

// ─── unsubscribe ──────────────────────────────────────────────────────────────

export async function unsubscribe(userId: string, endpoint: string): Promise<void> {
  await PushSubscription.deleteOne({
    endpoint,
    userId: new mongoose.Types.ObjectId(userId),
  });
}

// ─── updatePreferences ────────────────────────────────────────────────────────

export async function updatePreferences(
  userId: string,
  prefs: Partial<PushPreferences>
): Promise<PushPreferences> {
  const setObj: Record<string, boolean> = {};
  for (const [k, v] of Object.entries(prefs)) {
    if (v !== undefined) setObj[`preferences.push.${k}`] = v as boolean;
  }

  const updated = await UserModel.findByIdAndUpdate(
    userId,
    { $set: setObj },
    { new: true }
  ).select('preferences.push');

  const push = updated?.preferences?.push;
  return {
    achievements: push?.achievements ?? true,
    levelUp: push?.levelUp ?? true,
    streakReminder: push?.streakReminder ?? true,
  };
}

// ─── handleSendError ──────────────────────────────────────────────────────────

async function handleSendError(
  sub: IPushSubscription,
  err: unknown,
  serialized: string
): Promise<void> {
  const statusCode = (err as { statusCode?: number }).statusCode;

  if (statusCode === 410 || statusCode === 404) {
    await PushSubscription.deleteOne({ _id: sub._id });
    console.info(
      '[push] subscription deleted (gone)',
      { userId: sub.userId, endpoint: sub.endpoint.slice(0, 50) }
    );
    return;
  }

  if (statusCode === 429 || (statusCode !== undefined && statusCode >= 500)) {
    sub.failureCount += 1;
    if (sub.failureCount >= 5) {
      await PushSubscription.deleteOne({ _id: sub._id });
      console.info(
        '[push] subscription deleted (failure threshold)',
        { userId: sub.userId, endpoint: sub.endpoint.slice(0, 50) }
      );
    } else {
      await sub.save();
    }
    return;
  }

  // Network error (no statusCode) — retry once after 2s
  await new Promise((r) => setTimeout(r, 2000));
  try {
    await webPushClient.sendNotification(
      { endpoint: sub.endpoint, keys: sub.keys },
      serialized
    );
    sub.lastSuccessAt = new Date();
    sub.failureCount = 0;
    await sub.save();
  } catch {
    sub.failureCount += 1;
    if (sub.failureCount >= 5) {
      await PushSubscription.deleteOne({ _id: sub._id });
      console.info(
        '[push] subscription deleted (network failure threshold)',
        { userId: sub.userId, endpoint: sub.endpoint.slice(0, 50) }
      );
    } else {
      await sub.save();
    }
  }
}

// ─── sendToUser ───────────────────────────────────────────────────────────────

export async function sendToUser(
  userId: string,
  payload: PushNotificationPayload,
  _type: PushEventType
): Promise<{ successCount: number; totalCount: number }> {
  const truncatedPayload: PushNotificationPayload = {
    ...payload,
    body: payload.body.slice(0, 200),
  };
  const serialized = JSON.stringify(truncatedPayload);

  const subs = await PushSubscription.find({
    userId: new mongoose.Types.ObjectId(userId),
  });

  const results = await Promise.allSettled(
    subs.map((sub) =>
      webPushClient.sendNotification(
        { endpoint: sub.endpoint, keys: sub.keys },
        serialized
      ).then(async () => {
        sub.lastSuccessAt = new Date();
        sub.failureCount = 0;
        await sub.save();
      }).catch(async (err: unknown) => {
        await handleSendError(sub, err, serialized);
        throw err;
      })
    )
  );

  const successCount = results.filter((r) => r.status === 'fulfilled').length;
  return { successCount, totalCount: subs.length };
}
