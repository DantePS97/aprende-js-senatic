'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';

interface AdminGuardProps {
  children: React.ReactNode;
}

export function AdminGuard({ children }: AdminGuardProps) {
  const router = useRouter();
  const { isAuthenticated, isAdmin } = useAuthStore();
  // Match the hydration pattern from (platform)/layout.tsx:
  // Zustand persist hydrates from localStorage only on the client.
  // Without this flag, the first render always sees isAuthenticated=false
  // and the guard fires an incorrect redirect.
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;

    if (!isAuthenticated) {
      router.replace('/login?next=/admin');
      return;
    }

    if (!isAdmin) {
      router.replace('/courses');
    }
  }, [hydrated, isAuthenticated, isAdmin, router]);

  // While hydrating or during redirect: spinner (avoids flash of admin content)
  if (!hydrated || !isAuthenticated || !isAdmin) {
    return (
      <div className="min-h-screen bg-surface-900 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return <>{children}</>;
}
