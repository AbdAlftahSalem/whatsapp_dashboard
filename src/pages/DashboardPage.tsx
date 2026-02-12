import { useState } from 'react';
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
  RefreshCw,
  Maximize2,
  Minimize2,
  ChevronDown,
  ChevronUp,
  Wifi,
  WifiOff,
  Timer,
  Activity,
} from 'lucide-react';
import { StatsCard } from '@/components/ui/StatsCard';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { useQuery } from '@tanstack/react-query';
import { getDashboardData } from '@/lib/api';
import { formatDistanceToNow, parseISO, format } from 'date-fns';
import { ar } from 'date-fns/locale';

export default function DashboardPage() {
  const [responseTime, setResponseTime] = useState<number | null>(null);

  const { data, isLoading, error, refetch, isFetching, dataUpdatedAt } = useQuery({
    queryKey: ['dashboardData'],
    queryFn: async () => {
      const start = performance.now();
      try {
        const result = await getDashboardData();
        const end = performance.now();
        setResponseTime(Math.round(end - start));
        return result;
      } catch (err) {
        setResponseTime(null);
        throw err;
      }
    },
    refetchInterval: 60000,
  });

  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    servers: true,
    customers: false,
    sessions: false,
  });

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

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

  const { stats, proxyStatus, lastClients, lastSessions, servers } = dashboardData;

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'بدون تاريخ';
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
        <div className="flex flex-col items-end gap-2">
          <div className="flex items-center gap-3">
            {/* Connection Status */}
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border/50 text-[10px] font-medium transition-colors ${error ? 'bg-destructive/10 text-destructive border-destructive/20' : 'bg-success/10 text-success border-success/20'}`}>
              {error ? <WifiOff className="w-3 h-3" /> : <Wifi className="w-3 h-3 animate-pulse" />}
              {error ? 'غير متصل' : 'متصل بالخادم'}
            </div>

            <button
              onClick={() => refetch()}
              disabled={isFetching}
              className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-muted-foreground bg-muted/30 hover:bg-muted/50 disabled:opacity-50 rounded-full border border-border/50 transition-all hover:text-primary active:scale-95"
              title="تحديث البيانات"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin text-primary' : ''}`} />
              تحديث
            </button>
          </div>

          <div className="flex items-center gap-4 text-[10px] text-muted-foreground whitespace-nowrap">
            {dataUpdatedAt > 0 && (
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                آخر تحديث: {format(dataUpdatedAt, 'HH:mm:ss')}
              </div>
            )}
            {responseTime !== null && (
              <div className="flex items-center gap-1">
                <Timer className="w-3 h-3" />
                سرعة الاستجابة: {responseTime}ms
              </div>
            )}
            <div className="bg-muted/30 px-2 py-0.5 rounded border border-border/50 hidden sm:block">
              تحديث تلقائي كل 60 ثانية
            </div>
          </div>
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

      {/* Servers Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold text-foreground">حالة الخوادم</h2>
          </div>
          <button
            onClick={() => toggleSection('servers')}
            className="p-1.5 hover:bg-muted rounded-md transition-colors text-muted-foreground"
          >
            {expandedSections.servers ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>

        {expandedSections.servers && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {(!servers || servers.length === 0) ? (
              <div className="col-span-full p-8 text-center bg-muted/10 rounded-xl border border-dashed border-border/50">
                <Server className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">لا توجد بيانات للخوادم حالياً</p>
              </div>
            ) : (
              servers.map((server, index) => {
                const totalMaxSessions = server.subServers?.reduce((acc, sub) => acc + (sub.maxSessions || 0), 0) || 0;
                const types = Array.from(new Set(server.subServers?.map(sub => sub.type) || [])).join(' + ');
                const mainIp = server.subServers?.[0]?.ip || 'N/A';

                return (
                  <motion.div
                    key={server.serverCode}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 * index }}
                    className="stats-card p-6 hover:shadow-xl transition-all border-primary/5 bg-gradient-to-br from-background to-muted/30"
                  >
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20 shadow-inner text-primary">
                          <Server className="w-6 h-6" />
                        </div>
                        <div>
                          <h3 className="font-black text-xl tracking-tight text-foreground">{server.serverCode}</h3>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-muted-foreground font-mono">{mainIp}</span>
                            <div className="w-1 h-1 rounded-full bg-border" />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between text-xs font-bold">
                          <span className="text-muted-foreground uppercase tracking-widest">Total Sessions</span>
                          <div className="flex items-baseline gap-1">
                            <span className="text-lg font-black">{server.totalConnectedSessions || 0}</span>
                            <span className="text-muted-foreground/40">/</span>
                            <span className="text-muted-foreground">{totalMaxSessions}</span>
                          </div>
                        </div>
                        <div className="w-full h-2 bg-muted rounded-full overflow-hidden p-[1px] border border-border/50">
                          <div
                            className="h-full bg-primary rounded-full transition-all duration-1000 shadow-[0_0_10px_rgba(var(--primary),0.3)]"
                            style={{ width: `${Math.max(2, Math.min(((server.totalConnectedSessions || 0) / (totalMaxSessions || 1)) * 100, 100))}%` }}
                          />
                        </div>
                      </div>

                      {/* Sub-Servers Unified List */}
                      {server.subServers && server.subServers.length > 0 && (
                        <div className="pt-5 border-t border-border/40 space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                              <Activity className="w-3 h-3 text-primary/60" />
                              Sub-Units ({server.subServers.length})
                            </div>
                            <div className="h-px flex-1 bg-border/30 mx-4" />
                          </div>

                          <div className="grid grid-cols-1 gap-2">
                            {server.subServers.map((sub, sIdx) => (
                              <div key={sIdx} className="flex items-center justify-between p-2.5 rounded-xl bg-background/40 hover:bg-background/80 transition-colors border border-border/40 group/sub">
                                <div className="flex items-center gap-2.5">
                                  <div className={`w-2 h-2 rounded-full ${sub.status === 'Active' ? 'bg-success shadow-[0_0_8px_rgba(34,197,94,0.4)]' : 'bg-destructive'}`} />
                                  <div className="flex flex-col">
                                    <span className="text-[11px] font-black text-foreground group-hover/sub:text-primary transition-colors">{sub.type}</span>
                                    <span className="text-[9px] font-mono text-muted-foreground opacity-60">Port: {sub.port}</span>
                                  </div>
                                </div>
                                <div className="flex items-center gap-3">
                                  <div className="flex flex-col items-end">
                                    <span className="text-[9px] font-bold text-muted-foreground uppercase">Capacity</span>
                                    <span className="text-xs font-black">{sub.maxSessions}</span>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* Recent Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6">
        {/* Recent Customers */}
        <motion.div
          layout
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className={`stats-card ${expandedSections.customers ? 'lg:col-span-12' : 'lg:col-span-6'}`}
        >
          {/* ... inner content matches ... */}
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-foreground">آخر 5 عملاء مسجلين</h3>
            <div className="flex items-center gap-2">
              <button
                onClick={() => toggleSection('customers')}
                className="p-1 hover:bg-muted rounded-md transition-colors text-muted-foreground"
                title={expandedSections.customers ? "تصغير" : "توسيع"}
              >
                {expandedSections.customers ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>
              <Users className="w-5 h-5 text-muted-foreground" />
            </div>
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
                    {customer.name || 'عميل بدون اسم'}
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
          layout
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className={`stats-card ${expandedSections.sessions ? 'lg:col-span-12' : 'lg:col-span-6'}`}
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-foreground">آخر 5 جلسات مسجلة</h3>
            <div className="flex items-center gap-2">
              <button
                onClick={() => toggleSection('sessions')}
                className="p-1 hover:bg-muted rounded-md transition-colors text-muted-foreground"
                title={expandedSections.sessions ? "تصغير" : "توسيع"}
              >
                {expandedSections.sessions ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>
              <Smartphone className="w-5 h-5 text-muted-foreground" />
            </div>
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
                    {session.name || 'جلسة بدون اسم'}
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

    </div>
  );
}
