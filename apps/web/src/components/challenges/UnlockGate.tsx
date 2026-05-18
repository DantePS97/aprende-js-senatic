'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export function UnlockGate({
  unlocked,
  children,
}: {
  unlocked: boolean;
  children: React.ReactNode;
}) {
  const router = useRouter();

  useEffect(() => {
    if (!unlocked) router.replace('/retos/bloqueado');
  }, [unlocked, router]);

  if (!unlocked) return null;
  return <>{children}</>;
}
