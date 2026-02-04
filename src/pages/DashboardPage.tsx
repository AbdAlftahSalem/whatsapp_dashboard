import { motion } from 'framer-motion';
import {
  Building2,
  Smartphone,
  CheckCircle,
  MessageSquare,
  XCircle,
  Server,
  Users,
  Clock,
} from 'lucide-react';
import { StatsCard } from '@/components/ui/StatsCard';
import { StatusBadge } from '@/components/ui/StatusBadge';

// Mock data based on new spec
const stats = {
  sessionsReady: 1089,
  sessionsNotReady: 158,
  totalCustomers: 156,
  totalMessages: 458920,
  proxyHealth: 'healthy' as const,
};

const recentCustomers = [
  { id: 1, name: 'شركة الأمل للتجارة', email: 'info@alamal.com', phone: '+966501234567', createdAt: 'منذ ساعة' },
  { id: 2, name: 'مؤسسة النور', email: 'contact@alnoor.sa', phone: '+966507654321', createdAt: 'منذ 3 ساعات' },
  { id: 3, name: 'شركة الرياض المتحدة', email: 'hello@riyadh.com', phone: '+966509876543', createdAt: 'منذ 5 ساعات' },
  { id: 4, name: 'مجموعة الفجر', email: 'info@alfajr.sa', phone: '+966502345678', createdAt: 'منذ يوم' },
  { id: 5, name: 'شركة الخليج للاستثمار', email: 'invest@gulf.com', phone: '+966503456789', createdAt: 'منذ يومين' },
];

const recentUsers = [
  { id: 1, name: 'جهاز المبيعات 1', phone: '+966501234567', status: 'authenticated' as const, org: 'شركة الأمل', createdAt: 'منذ 30 دقيقة' },
  { id: 2, name: 'دعم العملاء', phone: '+966507654321', status: 'connecting' as const, org: 'مؤسسة النور', createdAt: 'منذ ساعتين' },
  { id: 3, name: 'التسويق', phone: '+966509876543', status: 'close' as const, org: 'شركة الرياض', createdAt: 'منذ 4 ساعات' },
  { id: 4, name: 'المبيعات الخارجية', phone: '+966502345678', status: 'authenticated' as const, org: 'مجموعة الفجر', createdAt: 'منذ 6 ساعات' },
  { id: 5, name: 'خدمة العملاء', phone: '+966504567890', status: 'open' as const, org: 'شركة الخليج', createdAt: 'منذ يوم' },
];

export default function DashboardPage() {
  return (
    <div className="space-y-6 lg:space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-xl lg:text-2xl font-bold text-foreground">لوحة التحكم</h1>
        <p className="text-sm text-muted-foreground mt-1">نظرة عامة على النظام</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 lg:gap-4">
        <StatsCard
          title="الجلسات الجاهزة"
          value={stats.sessionsReady.toLocaleString('ar-SA')}
          subtitle="متصلة ونشطة"
          icon={CheckCircle}
          variant="success"
        />
        <StatsCard
          title="الجلسات غير الجاهزة"
          value={stats.sessionsNotReady}
          subtitle="تحتاج اتصال"
          icon={XCircle}
          variant="error"
        />
        <StatsCard
          title="إجمالي العملاء"
          value={stats.totalCustomers}
          subtitle="مسجلين في النظام"
          icon={Building2}
          variant="primary"
        />
        <StatsCard
          title="الرسائل المرسلة"
          value={stats.totalMessages.toLocaleString('ar-SA')}
          subtitle="إجمالي الرسائل"
          icon={MessageSquare}
        />
        
        {/* Proxy Health Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="stats-card flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">حالة الـ Proxy</span>
            <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center">
              <Server className="w-5 h-5 text-success" />
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-success animate-pulse" />
              <span className="text-lg font-bold text-success">يعمل بشكل جيد</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">آخر فحص: منذ دقيقة</p>
          </div>
        </motion.div>
      </div>

      {/* Recent Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
        {/* Recent Customers */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="stats-card"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-foreground">آخر 5 عملاء مسجلين</h3>
            <Users className="w-5 h-5 text-muted-foreground" />
          </div>
          <div className="space-y-3">
            {recentCustomers.map((customer) => (
              <div
                key={customer.id}
                className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
              >
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <Building2 className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {customer.name}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {customer.email}
                  </p>
                </div>
                <div className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {customer.createdAt}
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Recent Users/Sessions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="stats-card"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-foreground">آخر 5 جلسات مسجلة</h3>
            <Smartphone className="w-5 h-5 text-muted-foreground" />
          </div>
          <div className="space-y-3">
            {recentUsers.map((user) => (
              <div
                key={user.id}
                className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
              >
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <Smartphone className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {user.name}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {user.org}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <StatusBadge status={user.status} />
                  <span className="text-xs text-muted-foreground">{user.createdAt}</span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Quick Stats Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        <div className="flex items-center gap-3 p-3 lg:p-4 rounded-xl bg-success/5 border border-success/20">
          <div className="w-8 lg:w-10 h-8 lg:h-10 rounded-lg bg-success/10 flex items-center justify-center shrink-0">
            <CheckCircle className="w-4 lg:w-5 h-4 lg:h-5 text-success" />
          </div>
          <div className="min-w-0">
            <p className="text-lg lg:text-2xl font-bold text-success">{stats.sessionsReady.toLocaleString('ar-SA')}</p>
            <p className="text-xs text-muted-foreground truncate">جلسات جاهزة</p>
          </div>
        </div>
        <div className="flex items-center gap-3 p-3 lg:p-4 rounded-xl bg-destructive/5 border border-destructive/20">
          <div className="w-8 lg:w-10 h-8 lg:h-10 rounded-lg bg-destructive/10 flex items-center justify-center shrink-0">
            <XCircle className="w-4 lg:w-5 h-4 lg:h-5 text-destructive" />
          </div>
          <div className="min-w-0">
            <p className="text-lg lg:text-2xl font-bold text-destructive">{stats.sessionsNotReady}</p>
            <p className="text-xs text-muted-foreground truncate">غير جاهزة</p>
          </div>
        </div>
        <div className="flex items-center gap-3 p-3 lg:p-4 rounded-xl bg-primary/5 border border-primary/20">
          <div className="w-8 lg:w-10 h-8 lg:h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <Building2 className="w-4 lg:w-5 h-4 lg:h-5 text-primary" />
          </div>
          <div className="min-w-0">
            <p className="text-lg lg:text-2xl font-bold text-primary">{stats.totalCustomers}</p>
            <p className="text-xs text-muted-foreground truncate">عميل مسجل</p>
          </div>
        </div>
        <div className="flex items-center gap-3 p-3 lg:p-4 rounded-xl bg-warning/5 border border-warning/20">
          <div className="w-8 lg:w-10 h-8 lg:h-10 rounded-lg bg-warning/10 flex items-center justify-center shrink-0">
            <MessageSquare className="w-4 lg:w-5 h-4 lg:h-5 text-warning" />
          </div>
          <div className="min-w-0">
            <p className="text-lg lg:text-2xl font-bold text-warning">{stats.totalMessages.toLocaleString('ar-SA')}</p>
            <p className="text-xs text-muted-foreground truncate">رسالة مرسلة</p>
          </div>
        </div>
      </div>
    </div>
  );
}
