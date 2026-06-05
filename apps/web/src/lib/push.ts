import type { PushSubscriptionPayload } from '@senatic/shared';

export function urlBase64ToUint8Array(base64String: string): ArrayBuffer {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  const arr = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) arr[i] = rawData.charCodeAt(i);
  return arr.buffer;
}

function getAuthHeaders(): HeadersInit {
  const token = typeof localStorage !== 'undefined' ? localStorage.getItem('accessToken') : null;
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export async function subscribeToPush(): Promise<PushSubscriptionPayload | null> {
  try {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') return null;

    const res = await fetch('/api/push/vapid-public-key');
    const { publicKey } = await res.json();

    const reg = await navigator.serviceWorker.ready;
    const subscription = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey),
    });

    const json = subscription.toJSON() as PushSubscriptionPayload;
    const payload: PushSubscriptionPayload = {
      ...json,
      userAgent: navigator.userAgent,
    };

    await fetch('/api/push/subscribe', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });

    return payload;
  } catch (err) {
    console.error('[push] subscribe error', err);
    return null;
  }
}

export async function unsubscribeFromPush(): Promise<void> {
  try {
    const reg = await navigator.serviceWorker.ready;
    const subscription = await reg.pushManager.getSubscription();
    if (!subscription) return;

    const endpoint = subscription.endpoint;
    await subscription.unsubscribe();

    await fetch('/api/push/subscribe', {
      method: 'DELETE',
      headers: getAuthHeaders(),
      body: JSON.stringify({ endpoint }),
    });
  } catch (err) {
    console.error('[push] unsubscribe error', err);
  }
}
