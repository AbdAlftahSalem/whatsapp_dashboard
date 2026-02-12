import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Server,
  Plus,
  Search,
  MoreVertical,
  RefreshCw,
  Trash2,
  Edit,
  Cpu,
  HardDrive,
  Activity,
  Power,
  CheckCircle,
  XCircle,
  Loader2,
  Globe,
  Settings,
  Shield,
  Clock,
  Database,
  Monitor,
  LayoutGrid,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';
import { getServers } from '@/lib/api';

interface ServerData {
  id: number;
  name: string;
  code: string;
  type: string;
  ip: string;
  port: number;
  status: 'online' | 'offline' | 'restarting' | 'shutdown';
  serverType: string;
  maxSessions: number;
  activeSessions: number;
  os?: string | null;
  uptime?: string | null;
  cpuUsage?: number | null;
  ramUsage?: number | null;
  ramTotal?: number | null;
  diskSpace?: string | null;
  lastCheck: string;
  location: string;
}

export default function ServersPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedServer, setSelectedServer] = useState<ServerData | null>(null);
  const [newServer, setNewServer] = useState({ 
    name: '', 
    ip: '', 
    port: '5021', 
    type: 'NORMAL',
    maxSessions: '100'
  });
  
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [jitter, setJitter] = useState({ cpu: 0, ram: 0 });

  const { toast } = useToast();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['servers'],
    queryFn: getServers,
    refetchInterval: 30000, // Refresh every 30s
  });

  // Real-time jitter effect for CPU/RAM (SRV-002)
  useEffect(() => {
    const interval = setInterval(() => {
      setJitter({
        cpu: Math.floor(Math.random() * 10) - 5,
        ram: (Math.random() * 0.5) - 0.25
      });
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  const rawServers = data?.data?.servers || [];
  
  const servers: ServerData[] = rawServers
    .filter(Boolean)
    .map((s: any, index: number) => {
      // Prefer service-level entry when provided
      const svc = Array.isArray(s.services) && s.services.length ? s.services[0] : s;
      const health = svc?.health ?? s?.health ?? null;

      // Determine status: if health is explicitly null -> shutdown, otherwise check SIST
      const status = health === null ? 'shutdown' : ((svc?.SIST ?? s?.SIST) === 1 ? 'online' : 'offline');

      // Use only API-provided metrics. If missing, keep null/undefined so UI can hide them.
      const cpuPercent: number | null = typeof health?.cpuPercent === 'number' ? health.cpuPercent : null;
      const ramUsed: number | null = typeof health?.memory?.usedGB === 'number' ? health.memory.usedGB : null;
      const ramTotal: number | null = typeof health?.memory?.totalGB === 'number' ? health.memory.totalGB : null;
      const readySessions: number = typeof health?.readySessions === 'number' ? health.readySessions : (typeof s?.readyCount === 'number' ? s.readyCount : (typeof s?.sessionCount === 'number' ? s.sessionCount : (svc?.SIMS ?? 0)));

      const uptimeStr = typeof health?.uptime === 'number' ? `${health.uptime} s` : null;

      return {
        id: svc?.SISEQ ?? s?.SISEQ ?? index,
        name: s?.SISN ?? svc?.SISN ?? `Server-${index}`,
        code: svc?.SIRM ?? s?.SIRM ?? `SVR-${svc?.SISEQ ?? index}`,
        type: svc?.SITY ?? s?.SITY ?? 'NORMAL',
        ip: svc?.SIIP ?? s?.SIIP ?? '0.0.0.0',
        port: svc?.SIPO ?? s?.SIPO ?? 5021,
        status,
        serverType: svc?.SITY ?? s?.SITY ?? 'NORMAL',
        maxSessions: svc?.SIMS ?? s?.SIMS ?? 100,
        activeSessions: readySessions,
        os: svc?.SIAF1 ?? s?.SIAF1 ?? null,
        uptime: uptimeStr,
        cpuUsage: cpuPercent,
        ramUsage: ramUsed,
        ramTotal: ramTotal,
        diskSpace: svc?.SIDE ?? s?.SIDE ?? null,
        lastCheck: svc?.SILC ? new Date(svc.SILC).toLocaleTimeString('ar-YE') : (s?.SILC ? new Date(s.SILC).toLocaleTimeString('ar-YE') : ''),
        location: svc?.SIAF2 ?? s?.SIAF2 ?? '',
      };
    });

  const filteredServers = servers.filter(
    (server) =>
      server.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      server.ip.includes(searchQuery) ||
      server.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalPages = Math.ceil(filteredServers.length / pageSize);
  const paginatedServers = filteredServers.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const handleAddServer = () => {
    // Basic IP Validation
    const ipRegex = /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/;
    if (!ipRegex.test(newServer.ip)) {
      toast({ 
        title: 'خطأ في التحقق', 
        description: 'يرجى إدخال عنوان IP صحيح (مثال: 192.168.1.1)',
        variant: 'destructive'
      });
      return;
    }

    if (!newServer.name) {
      toast({ 
        title: 'حقول مطلوبة', 
        description: 'يرجى إدخال اسم الخادم',
        variant: 'destructive'
      });
      return;
    }

    toast({ title: 'تمت الإضافة بنجاح', description: 'تمت إضافة الخادم بنجاح (محاكاة)' });
    setIsAddModalOpen(false);
  };

  const handleEditServer = () => {
    // In a real app, this would be an API call
    toast({ title: 'ميزة تعديل خادم ستتوفر قريباً عبر الـ API' });
    setIsEditModalOpen(false);
  };

  const handleDeleteServer = (id: number) => {
    // In a real app, this would be an API call
    toast({ title: 'ميزة حذف خادم ستتوفر قريباً عبر الـ API', variant: 'destructive' });
  };

  const handleRestartServer = (id: number) => {
    // In a real app, this would be an API call
    toast({ title: 'جاري إرسال طلب إعادة التشغيل...' });
  };

  const handleRestartAll = () => {
    // In a real app, this would be an API call
    toast({ title: 'جاري إرسال طلب إعادة تشغيل جميع الخوادم...' });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'online': return <CheckCircle className="w-4 h-4 text-success" />;
      case 'offline': return <XCircle className="w-4 h-4 text-destructive" />;
      case 'restarting': return <RefreshCw className="w-4 h-4 text-warning animate-spin" />;
      case 'shutdown': return <AlertTriangle className="w-4 h-4 text-destructive" />;
      default: return null;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'online': return 'متصل';
      case 'offline': return 'غير متصل';
      case 'restarting': return 'جاري الإعادة';
      case 'shutdown': return 'مغلق';
      default: return status;
    }
  };

  const getResourceColor = (usage: number) => {
    if (usage >= 81) return 'bg-destructive';
    if (usage >= 61) return 'bg-warning';
    return 'bg-success';
  };

  const getResourceTextColor = (usage: number) => {
    if (usage >= 81) return 'text-destructive';
    if (usage >= 61) return 'text-warning';
    return 'text-success';
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
        <p className="text-muted-foreground animate-pulse">جاري تحميل بيانات الخوادم...</p>
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
          <h3 className="text-lg font-semibold text-foreground">فشل تحميل بيانات الخوادم</h3>
          <p className="text-sm text-muted-foreground mt-1">يرجى التحقق من اتصالك بالخادم والمحاولة مرة أخرى</p>
          <Button variant="outline" onClick={() => refetch()} className="mt-4">
            تحميل مرة أخرى
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-[1600px] mx-auto">
      {/* Premium Header */}
      <div className="relative space-y-4">
        <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-muted-foreground/60 font-bold">
          <span>الرئيسية</span>
          <ChevronLeft className="w-3 h-3" />
          <span className="text-primary">الخوادم</span>
        </div>
        
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-1">
            <h1 className="text-3xl lg:text-4xl font-black text-foreground tracking-tight flex items-center gap-4">
              إدارة الخوادم
            </h1>
            <p className="text-sm text-muted-foreground font-medium max-w-2xl px-1">
              نظام المراقبة والتحكم المركزي بجميع موارد خوادم المنصة ومعالجة البيانات
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={handleRestartAll} className="h-11 px-5 rounded-xl border-border/60 bg-background/50 hover:bg-muted/50 transition-all font-bold text-xs uppercase tracking-wider">
              <RefreshCw className="w-4 h-4 ml-2 text-muted-foreground" />
              إعادة تشغيل النظام
            </Button>
            <Button onClick={() => setIsAddModalOpen(true)} className="h-11 px-6 rounded-xl shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all font-bold text-xs uppercase tracking-wider">
              <Plus className="w-4 h-4 ml-2" />
              إضافة خادم جديد
            </Button>
          </div>
        </div>
      </div>

      {/* Live Overview Widgets (Premium Feel) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pb-2">
        <div className="premium-card p-4 bg-primary/[0.02] border-primary/10">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">إجمالي الخوادم</p>
              <h4 className="text-2xl font-black">{servers.length}</h4>
            </div>
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <Monitor className="w-5 h-5" />
            </div>
          </div>
        </div>
        <div className="premium-card p-4 bg-success/[0.02] border-success/10">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">الخوادم المتصلة</p>
              <h4 className="text-2xl font-black text-success">{servers.filter(s => s.status === 'online').length}</h4>
            </div>
            <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center text-success">
              <CheckCircle className="w-5 h-5" />
            </div>
          </div>
        </div>
        <div className="premium-card p-4 bg-destructive/[0.02] border-destructive/10">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">متوسط استهلاك المعالج</p>
              <h4 className="text-2xl font-black">
                {(() => {
                  const sum = servers.reduce((acc, s) => (typeof s.cpuUsage === 'number' ? acc + s.cpuUsage : acc), 0);
                  const count = servers.reduce((acc, s) => (typeof s.cpuUsage === 'number' ? acc + 1 : acc), 0);
                  return `${count ? Math.round(sum / count) : 0}%`;
                })()}
              </h4>
            </div>
            <div className="w-10 h-10 rounded-xl bg-destructive/10 flex items-center justify-center text-destructive">
              <Cpu className="w-5 h-5" />
            </div>
          </div>
        </div>
        <div className="premium-card p-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">إجمالي الجلسات</p>
              <h4 className="text-2xl font-black text-primary">
                {servers.reduce((acc, s) => acc + s.activeSessions, 0)}
              </h4>
            </div>
            <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center text-muted-foreground">
              <Database className="w-5 h-5" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters & Actions bar - Glass Panel */}
      <div className="glass-panel p-2 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4 sticky top-4 z-40 shadow-xl shadow-black/5 ring-1 ring-black/5">
        <div className="relative w-full md:w-96">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
          <Input
            placeholder="البحث السريع عن الخوادم بـ (الاسم، IP، الكود)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pr-10 h-11 border-none bg-transparent focus-visible:ring-0 text-sm font-medium"
          />
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto px-4">
          <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-widest px-3 py-1.5 rounded-lg bg-muted/50 border border-border/50">
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>نتائج البحث: {filteredServers.length}</span>
          </div>
        </div>
      </div>

      {/* Server Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {paginatedServers.map((server, index) => (
          <motion.div
            key={server.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="premium-card group"
          >
            {/* Glassy Header */}
            <div className="p-5 border-b border-border/40 bg-muted/5">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-xl transition-all duration-300 ${
                    server.status === 'online' 
                    ? 'bg-success/10 text-success shadow-[0_0_15px_rgba(34,197,94,0.1)]' 
                    : server.status === 'shutdown' ? 'bg-destructive/10 text-destructive shadow-[0_0_15px_rgba(239,68,68,0.06)]' : 'bg-muted text-muted-foreground'
                  }`}>
                    <Server className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground tracking-tight flex items-center gap-2">
                      {server.name}
                      <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-primary/10 text-primary uppercase font-bold tracking-tighter">
                        {server.serverType}
                      </span>
                    </h3>
                    <div className="flex items-center gap-1.5 mt-1">
                      <div className={`w-1.5 h-1.5 rounded-full ${
                        server.status === 'online' ? 'bg-success animate-pulse' : server.status === 'shutdown' ? 'bg-destructive' : 'bg-muted'
                      }`} />
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                        {getStatusLabel(server.status)}
                      </span>
                      <span className="text-[10px] text-muted-foreground/40 mx-1">|</span>
                      <span className="text-[10px] font-mono text-muted-foreground" dir="ltr">{server.ip}</span>
                    </div>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-muted/80">
                      <MoreVertical className="w-4 h-4 text-muted-foreground" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem className="gap-2 py-2" onClick={() => { setSelectedServer(server); setIsEditModalOpen(true); }}>
                      <Edit className="w-4 h-4" />
                      <span>تعديل الإعدادات</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem className="gap-2 py-2" onClick={() => handleRestartServer(server.id)}>
                      <RefreshCw className="w-4 h-4" />
                      <span>إعادة التشغيل</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="gap-2 py-2 text-destructive font-medium" onClick={() => handleDeleteServer(server.id)}>
                      <Trash2 className="w-4 h-4" />
                      <span>حذف الخادم</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            <div className="p-5 space-y-6">
              {/* Resources - Compact Rows */}
              {server.status === 'online' && server.cpuUsage != null && server.ramUsage != null && server.ramTotal != null ? (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">
                      <div className="flex items-center gap-1.5">
                        <Cpu className="w-3 h-3" />
                        معالج النظام (CPU)
                      </div>
                      <span className={getResourceTextColor(server.cpuUsage)}>{Math.round(server.cpuUsage)}%</span>
                    </div>
                    <div className="resource-progress">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${server.cpuUsage}%` }}
                        className={`resource-progress-inner ${getResourceColor(server.cpuUsage)}`}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">
                      <div className="flex items-center gap-1.5">
                        <HardDrive className="w-3 h-3" />
                        ذاكرة النظام (RAM)
                      </div>
                      <span className={getResourceTextColor((server.ramUsage / server.ramTotal) * 100)}>
                        {Math.round((server.ramUsage / server.ramTotal) * 100)}%
                      </span>
                    </div>
                    <div className="resource-progress">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${(server.ramUsage / server.ramTotal) * 100}%` }}
                        className={`resource-progress-inner ${getResourceColor((server.ramUsage / server.ramTotal) * 100)}`}
                      />
                    </div>
                    <div className="flex justify-between text-[9px] text-muted-foreground/60 font-mono mt-1">
                      <span>{server.ramUsage.toFixed(1)} GB مستخدم</span>
                      <span>{server.ramTotal} GB إجمالي</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-4 text-center rounded-md bg-muted/10 border border-border/30">
                  <p className="text-sm font-bold text-muted-foreground">بيانات الأداء غير متوفرة — الخادم غير متصل أو غير متاح</p>
                </div>
              )}

              {/* Stats Grid - Cleaner icons & layout (only when online) */}
              {server.status === 'online' && (
                <div className="grid grid-cols-2 gap-4 pb-2">
                  <div className="p-2.5 rounded-xl bg-muted/30 border border-border/20 group-hover:bg-muted/50 transition-colors">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-1.5 mb-1.5">
                      <Database className="w-3 h-3 text-primary/70" />
                      الجلسات
                    </p>
                    <p className="text-sm font-bold text-foreground">
                      {server.activeSessions} <span className="text-[10px] text-muted-foreground font-normal">/ {server.maxSessions}</span>
                    </p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-muted/30 border border-border/20 group-hover:bg-muted/50 transition-colors">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-1.5 mb-1.5">
                      <Activity className="w-3 h-3 text-primary/70" />
                      المساحة
                    </p>
                    <p className="text-sm font-bold text-foreground">{server.diskSpace ? String(server.diskSpace).split(' / ')[0] : 'N/A'}</p>
                  </div>
                </div>
              )}

              {/* Technical Footer (only when online) */}
              {server.status === 'online' && (
                <div className="pt-4 border-t border-border/40 flex items-center justify-between text-[10px]">
                  <div className="flex items-center gap-3 text-muted-foreground/70">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {server.uptime}
                    </div>
                    <div className="w-1 h-1 rounded-full bg-border" />
                    <div className="flex items-center gap-1 font-mono">
                      <RefreshCw className="w-3 h-3" />
                      {server.lastCheck}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 font-mono text-muted-foreground/40 bg-muted/50 px-2 py-0.5 rounded border border-border/30">
                    {server.code}
                  </div>
                </div>
              )}
            </div>

            {/* High Usage Alert Overlay (SRV-002) */}
            {server.status === 'online' && (server.cpuUsage > 80 || (server.ramUsage / server.ramTotal) > 0.85) && (
              <div className="absolute top-0 left-0 w-full h-1 bg-destructive shadow-[0_2px_10px_rgba(239,68,68,0.4)] animate-pulse" />
            )}
          </motion.div>
        ))}
        {filteredServers.length === 0 && (
          <div className="col-span-full p-12 text-center bg-muted/20 rounded-2xl border border-dashed border-border py-20 flex flex-col items-center justify-center">
            <div className="w-16 h-16 rounded-full bg-muted/30 flex items-center justify-center mb-4">
              <Server className="w-8 h-8 text-muted-foreground/40" />
            </div>
            <p className="text-muted-foreground font-medium">لا توجد خوادم تطابق بحثك حالياً</p>
            <Button variant="link" onClick={() => setSearchQuery('')} className="mt-2 text-primary font-bold">
              مسح فلاتر البحث
            </Button>
          </div>
        )}
      </div>

      {/* Pagination */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-6 border-t border-border/50">
        <div className="flex items-center gap-4 order-2 md:order-1">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">عرض</span>
            <Select 
              value={pageSize.toString()} 
              onValueChange={(v) => {
                setPageSize(Number(v));
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="w-20 h-9 bg-card">
                <SelectValue />
              </SelectTrigger>
              <SelectContent dir="rtl">
                <SelectItem value="20">20</SelectItem>
                <SelectItem value="25">25</SelectItem>
                <SelectItem value="30">30</SelectItem>
              </SelectContent>
            </Select>
            <span className="text-sm text-muted-foreground">خادم بكل صفحة</span>
          </div>
          <span className="text-xs text-muted-foreground hidden sm:inline">
            إظهار {(currentPage - 1) * pageSize + 1} إلى {Math.min(currentPage * pageSize, filteredServers.length)} من {filteredServers.length} خوادم
          </span>
        </div>

        <div className="flex items-center gap-2 order-1 md:order-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            className="h-9 px-3 bg-card border-border/60 hover:bg-muted/50"
          >
            <ChevronRight className="w-4 h-4 ml-1" />
            السابق
          </Button>
          
          <div className="flex items-center gap-1 px-4 text-sm font-medium">
            <span>صفحة {currentPage}</span>
            <span className="text-muted-foreground mx-1">من</span>
            <span>{totalPages}</span>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages || totalPages === 0}
            className="h-9 px-3 bg-card border-border/60 hover:bg-muted/50"
          >
            التالي
            <ChevronLeft className="w-4 h-4 mr-1" />
          </Button>
        </div>
      </div>


      {/* Add Server Modal (SRV-003) */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">إضافة خادم جديد</DialogTitle>
            <DialogDescription>أدخل معلومات الخادم الجديد لتشغيل الخدمات عليه</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="col-span-2 space-y-2">
              <Label className="text-xs font-bold text-muted-foreground uppercase">اسم الخادم (Server Name)</Label>
              <Input
                value={newServer.name}
                onChange={(e) => setNewServer({ ...newServer, name: e.target.value })}
                placeholder="مثال: خادم الرسائل الرئيسي"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold text-muted-foreground uppercase">عنوان IP</Label>
              <Input
                value={newServer.ip}
                onChange={(e) => setNewServer({ ...newServer, ip: e.target.value })}
                placeholder="192.168.1.1"
                dir="ltr"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold text-muted-foreground uppercase">المنفذ (Port)</Label>
              <Input
                value={newServer.port}
                onChange={(e) => setNewServer({ ...newServer, port: e.target.value })}
                placeholder="5021"
                dir="ltr"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold text-muted-foreground uppercase">نوع السيرفر</Label>
              <Select value={newServer.type} onValueChange={(v) => setNewServer({ ...newServer, type: v })}>
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder="اختر النوع" />
                </SelectTrigger>
                <SelectContent dir="rtl">
                  <SelectItem value="NORMAL">NORMAL</SelectItem>
                  <SelectItem value="CONTROL">CONTROL</SelectItem>
                  <SelectItem value="M">M</SelectItem>
                  <SelectItem value="B">B</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold text-muted-foreground uppercase">الحد الأقصى للجلسات</Label>
              <Input
                type="number"
                value={newServer.maxSessions}
                onChange={(e) => setNewServer({ ...newServer, maxSessions: e.target.value })}
                placeholder="100"
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setIsAddModalOpen(false)} className="px-6">إلغاء</Button>
            <Button onClick={handleAddServer} className="px-8 shadow-lg shadow-primary/20">حفظ الخادم</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Server Modal (SRV-005) */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">تعديل بيانات الخادم</DialogTitle>
            <DialogDescription>تحديث المعلومات الفنية للخادم المتربط بالعمليات</DialogDescription>
          </DialogHeader>
          {selectedServer && (
            <div className="grid grid-cols-2 gap-4 py-4">
              <div className="col-span-2 space-y-2">
                <Label className="text-xs font-bold text-muted-foreground uppercase">اسم الخادم</Label>
                <Input
                  value={selectedServer.name}
                  onChange={(e) => setSelectedServer({ ...selectedServer, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold text-muted-foreground uppercase">عنوان IP</Label>
                <Input
                  value={selectedServer.ip}
                  onChange={(e) => setSelectedServer({ ...selectedServer, ip: e.target.value })}
                  dir="ltr"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold text-muted-foreground uppercase">المنفذ (Port)</Label>
                <Input
                  value={String(selectedServer.port)}
                  onChange={(e) => setSelectedServer({ ...selectedServer, port: Number(e.target.value) })}
                  dir="ltr"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold text-muted-foreground uppercase">نوع السيرفر</Label>
                <Select value={selectedServer.serverType} onValueChange={(v) => setSelectedServer({ ...selectedServer, serverType: v })}>
                  <SelectTrigger className="bg-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent dir="rtl">
                    <SelectItem value="NORMAL">NORMAL</SelectItem>
                    <SelectItem value="CONTROL">CONTROL</SelectItem>
                    <SelectItem value="M">M</SelectItem>
                    <SelectItem value="B">B</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold text-muted-foreground uppercase">الحد الأقصى للجلسات</Label>
                <Input
                  type="number"
                  value={selectedServer.maxSessions}
                  onChange={(e) => setSelectedServer({ ...selectedServer, maxSessions: Number(e.target.value) })}
                />
              </div>
            </div>
          )}
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setIsEditModalOpen(false)} className="px-6">إلغاء</Button>
            <Button onClick={handleEditServer} className="px-8 shadow-lg shadow-primary/20">تحديث البيانات</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}