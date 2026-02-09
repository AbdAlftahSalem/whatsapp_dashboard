import { Navigate, Outlet } from 'react-router-dom';
import { motion } from 'framer-motion';
import { DashboardSidebar } from './DashboardSidebar';
import { useAuthStore } from '@/stores/authStore';

export function DashboardLayout() {
  const { isAuthenticated } = useAuthStore();

  // التحقق من المصادقة قبل عرض لوحة التحكم
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardSidebar />

      {/* Main Content - responsive margin */}
      <main className="lg:mr-64 min-h-screen">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="p-4 pt-16 lg:pt-8 lg:p-8"
        >
          <Outlet />
        </motion.div>
      </main>
    </div>
  );
}
