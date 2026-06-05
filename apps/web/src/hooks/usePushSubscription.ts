'use client';

import { useEffect, useState } from 'react';
import { usePushStore } from '@/store/pushStore';
import { subscribeToPush, unsubscribeFromPush } from '@/lib/push';
import type { PushPermissionStatus } from '@senatic/shared';

export function usePushSubscription() {
  const setStatus = usePushStore((s) => s.setStatus);
  const status = usePushStore((s) => s.status);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!('Notification' in window)) {
      setStatus('unsupported');
      return;
    }

    const permission = Notification.permission;
    if (permission === 'denied') {
      setStatus('denied');
      return;
    }

    navigator.serviceWorker?.ready.then((reg) => {
      reg.pushManager.getSubscription().then((sub) => {
        setStatus(sub ? 'subscribed' : (permission as PushPermissionStatus));
      });
    });
  }, [setStatus]);

  const subscribe = async () => {
    setIsLoading(true);
    try {
      const result = await subscribeToPush();
      if (result) setStatus('subscribed');
    } finally {
      setIsLoading(false);
    }
  };

  const unsubscribe = async () => {
    setIsLoading(true);
    try {
      await unsubscribeFromPush();
      setStatus('default');
    } finally {
      setIsLoading(false);
    }
  };

  return { status, subscribe, unsubscribe, isLoading };
}
