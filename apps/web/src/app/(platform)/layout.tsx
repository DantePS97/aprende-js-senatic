'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { BottomNav } from '@/components/layout/BottomNav';
import { OfflineBanner } from '@/components/layout/OfflineBanner';
import { ToastContainer } from '@/components/gamification/AchievementToast';
import { SyncProvider } from '@/components/layout/SyncProvider';

export default function PlatformLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  // Zustand persist hidrata desde localStorage solo en el cliente.
  // Sin esta bandera, el primer render siempre ve isAuthenticated=false
  // y el guard dispara un redirect incorrecto.
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated && !isAuthenticated) {
      router.replace('/login');
    }
  }, [hydrated, isAuthenticated, router]);

  // Mientras hidrata o si no hay sesión: spinner mínimo (evita flash)
  if (!hydrated || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-surface-900 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <SyncProvider>
      <OfflineBanner />
      <main className="min-h-screen bg-surface-900 pb-20">
        {children}
      </main>
      <BottomNav />
      <ToastContainer />
    </SyncProvider>
  );
}
