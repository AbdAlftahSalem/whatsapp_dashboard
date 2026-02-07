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
  Loader2,
} from 'lucide-react';
import { StatsCard } from '@/components/ui/StatsCard';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { useQuery } from '@tanstack/react-query';
import { getDashboardData } from '@/lib/api';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { ar } from 'date-fns/locale';

export default function DashboardPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['dashboardData'],
    queryFn: getDashboardData,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
        <p className="text-muted-foreground animate-pulse">جاري تحميل البيانات...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4 text-center">
        <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
          <XCircle className="w-6 h-6 text-destructive" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-foreground">فشل تحميل البيانات</h3>
          <p className="text-sm text-muted-foreground mt-1">يرجى التحقق من اتصالك بالخادم والمحاولة مرة أخرى</p>
        </div>
      </div>
    );
  }

  const dashboardData = data?.data;
  if (!dashboardData) return null;

  const { stats, proxyStatus, lastClients, lastSessions } = dashboardData;

  const formatDate = (dateString: string) => {
    try {
      return formatDistanceToNow(parseISO(dateString), { addSuffix: true, locale: ar });
    } catch (e) {
      return dateString;
    }
  };

  return (
    <div className="space-y-6 lg:space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-foreground">لوحة التحكم</h1>
          <p className="text-sm text-muted-foreground mt-1">نظرة عامة على النظام</p>
        </div>
        <div className="text-xs text-muted-foreground bg-muted/30 px-3 py-1.5 rounded-full border border-border/50">
          تحديث تلقائي كل 30 ثانية
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 lg:gap-4">
        <StatsCard
          title="الجلسات الجاهزة"
          value={stats.readySessions.toLocaleString('ar-SA')}
          subtitle="متصلة ونشطة"
          icon={CheckCircle}
          variant="success"
        />
        <StatsCard
          title="الجلسات غير الجاهزة"
          value={stats.notReadySessions.toLocaleString('ar-SA')}
          subtitle="تحتاج اتصال"
          icon={XCircle}
          variant="error"
        />
        <StatsCard
          title="إجمالي العملاء"
          value={stats.totalClients.toLocaleString('ar-SA')}
          subtitle="مسجلين في النظام"
          icon={Building2}
          variant="primary"
        />
        <StatsCard
          title="الرسائل المرسلة"
          value={stats.totalSentMessages.toLocaleString('ar-SA')}
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
            <div className={`w-10 h-10 rounded-xl ${proxyStatus.isWorking ? 'bg-success/10' : 'bg-destructive/10'} flex items-center justify-center`}>
              <Server className={`w-5 h-5 ${proxyStatus.isWorking ? 'text-success' : 'text-destructive'}`} />
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${proxyStatus.isWorking ? 'bg-success animate-pulse' : 'bg-destructive'}`} />
              <span className={`text-lg font-bold ${proxyStatus.isWorking ? 'text-success' : 'text-destructive'}`}>
                {proxyStatus.message}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">آخر فحص: {formatDate(proxyStatus.lastCheck)}</p>
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
            {lastClients.map((customer, index) => (
              <div
                key={index}
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
                    {customer.email || 'لا يوجد بريد إلكتروني'}
                  </p>
                </div>
                <div className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {formatDate(customer.registeredAt)}
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
            {lastSessions.map((session, index) => (
              <div
                key={index}
                className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
              >
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <Smartphone className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {session.name}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {session.clientName}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <StatusBadge status={session.status as any} />
                  <span className="text-xs text-muted-foreground">{formatDate(session.registeredAt)}</span>
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
            <p className="text-lg lg:text-2xl font-bold text-success">{stats.readySessions.toLocaleString('ar-SA')}</p>
            <p className="text-xs text-muted-foreground truncate">جلسات جاهزة</p>
          </div>
        </div>
        <div className="flex items-center gap-3 p-3 lg:p-4 rounded-xl bg-destructive/5 border border-destructive/20">
          <div className="w-8 lg:w-10 h-8 lg:h-10 rounded-lg bg-destructive/10 flex items-center justify-center shrink-0">
            <XCircle className="w-4 lg:w-5 h-4 lg:h-5 text-destructive" />
          </div>
          <div className="min-w-0">
            <p className="text-lg lg:text-2xl font-bold text-destructive">{stats.notReadySessions.toLocaleString('ar-SA')}</p>
            <p className="text-xs text-muted-foreground truncate">غير جاهزة</p>
          </div>
        </div>
        <div className="flex items-center gap-3 p-3 lg:p-4 rounded-xl bg-primary/5 border border-primary/20">
          <div className="w-8 lg:w-10 h-8 lg:h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <Building2 className="w-4 lg:w-5 h-4 lg:h-5 text-primary" />
          </div>
          <div className="min-w-0">
            <p className="text-lg lg:text-2xl font-bold text-primary">{stats.totalClients.toLocaleString('ar-SA')}</p>
            <p className="text-xs text-muted-foreground truncate">عميل مسجل</p>
          </div>
        </div>
        <div className="flex items-center gap-3 p-3 lg:p-4 rounded-xl bg-warning/5 border border-warning/20">
          <div className="w-8 lg:w-10 h-8 lg:h-10 rounded-lg bg-warning/10 flex items-center justify-center shrink-0">
            <MessageSquare className="w-4 lg:w-5 h-4 lg:h-5 text-warning" />
          </div>
          <div className="min-w-0">
            <p className="text-lg lg:text-2xl font-bold text-warning">{stats.totalSentMessages.toLocaleString('ar-SA')}</p>
            <p className="text-xs text-muted-foreground truncate">رسالة مرسلة</p>
          </div>
        </div>
      </div>
    </div>
  );
}
