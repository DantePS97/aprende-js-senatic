import { BottomNav } from '@/components/layout/BottomNav';
import { OfflineBanner } from '@/components/layout/OfflineBanner';
import { ToastContainer } from '@/components/gamification/AchievementToast';

export default function PlatformLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <OfflineBanner />
      <main className="min-h-screen bg-surface-900 pb-20 md:pb-0">
        {children}
      </main>
      <BottomNav />
      <ToastContainer />
    </>
  );
}
