import { AdminGuard } from '@/components/admin/AdminGuard';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { ToastContainer } from '@/components/admin/Toast';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminGuard>
      <div className="flex h-screen bg-gray-50 overflow-hidden">
        <AdminSidebar />
        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </div>
      <ToastContainer />
    </AdminGuard>
  );
}
