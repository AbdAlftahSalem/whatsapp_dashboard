import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  AlertTriangle,
  Table as TableIcon,
  ArrowUpDown,
  Edit2,
  Building2,
  Calendar,
  MoreHorizontal,
  Wifi,
  WifiOff,
  CheckCircle,
  XCircle,
  Loader2,
  Database,
  Monitor,
  LayoutGrid,
  ChevronLeft,
  ChevronRight,
  Shield,
  Settings,
  Globe,
  Clock,
} from 'lucide-react';
import { Area, AreaChart, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { StatusBadge } from '@/components/ui/StatusBadge';
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
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getServers, addServer, deleteServer, updateServer } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import { PageLoader } from '@/components/ui/PageLoader';
import { PageError } from '@/components/ui/PageError';

interface ServerData {
  id: number;
  name: string;
  code: string;
  type: string;
  ip: string;
  port: number;
  status: 'online' | 'offline' | 'restarting' | 'shutdown';
  runMode: string;
  maxSessions: number;
  activeSessions: number;
  os: string | null;
  uptime: string | null;
  cpuUsage: number | null;
  ramUsage: number | null;
  ramTotal: number | null;
  diskSpace: string | null;
  lastCheck: string;
  location: string;
  protocol: string;
  history?: { cpu: number; ram: number }[];
}

export default function ServersPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [sortConfig, setSortConfig] = useState<{ key: keyof ServerData, direction: 'asc' | 'desc' }>({
    key: 'id',
    direction: 'asc'
  });
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedServer, setSelectedServer] = useState<ServerData | null>(null);
  const [serverHistory, setServerHistory] = useState<Record<number, { cpu: number; ram: number }[]>>({});
  const [isSubmittingServer, setIsSubmittingServer] = useState(false);
  
  const [newServer, setNewServer] = useState({ 
    SISN: '',           // رمز الخادم (Server Name/Code)
    SITY: 'NORMAL',     // نوع الخدمة (Server Type)
    SIIP: '',           // عنوان IP
    SIPO: '5021',       // المنفذ
    SIPT: 'HTTP',       // البروتوكول
    SIST: 1,            // حالة الخدمة
    SIRM: 'N',          // SERVICE_RUN_MODE
    SIRT: 'PATH',       // نوع التوجيه
    SIMS: '250',        // الحد الأقصى للجلسات
    SIAUY: '2',         // هل الخدمة تحتاج AUTH
    SIWE: '1',          // وزن السيرفر
    SITMS: '15000',     // مهلة الاتصال
    SIMC: '100',        // الحد الأقصى للاتصالات المتزامنة
    SIDE: '',           // تفاصيل
    SIAF1: '',          // حقل إضافي 1
    SIAF2: '',          // حقل إضافي 2
  });
  
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [serverToDelete, setServerToDelete] = useState<ServerData | null>(null);
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);
  const [originalServerData, setOriginalServerData] = useState<ServerData | null>(null);

  const { toast } = useToast();
  const { accessToken: token } = useAuthStore();
  const queryClient = useQueryClient();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['servers'],
    queryFn: getServers,
    refetchInterval: 15000,
  });

  // Track history for charts (SRV-002)
  useEffect(() => {
    if (data?.data?.servers) {
      setServerHistory(prev => {
        const next = { ...prev };
        data.data.servers.forEach((s: any) => {
          const services = Array.isArray(s.services) && s.services.length ? s.services : [s];
          services.forEach((svc: any) => {
            const id = svc?.SISEQ ?? s?.SISEQ;
            const health = svc?.health ?? s?.health;
            if (id && health) {
              const cpu = health.cpuPercent ?? 0;
              const ram = health.memory?.usedGB ? (health.memory.usedGB / (health.memory.totalGB || 1)) * 100 : 0;
              const currentHistory = next[id] || [];
              next[id] = [...currentHistory, { cpu, ram }].slice(-10);
            }
          });
        });
        return next;
      });
    }
  }, [data]);

  const rawServers = data?.data?.servers || [];
  
  const servers: ServerData[] = useMemo(() => {
    return rawServers
      .filter(Boolean)
      .flatMap((s: any, serverIndex: number) => {
        const services = Array.isArray(s.services) && s.services.length > 0 ? s.services : [s];
        
        return services.map((svc: any, svcIndex: number) => {
          const id = svc?.SISEQ ?? s?.SISEQ ?? `${serverIndex}-${svcIndex}`;
          const health = svc?.health ?? s?.health ?? null;
          const status = health === null ? 'shutdown' : ((svc?.SIST ?? s?.SIST) === 1 ? 'online' : 'offline');

          const cpuPercent: number | null = typeof health?.cpuPercent === 'number' ? health.cpuPercent : null;
          const ramUsed: number | null = typeof health?.memory?.usedGB === 'number' ? health.memory.usedGB : null;
          const ramTotal: number | null = typeof health?.memory?.totalGB === 'number' ? health.memory.totalGB : null;
          const readySessions: number = typeof health?.readySessions === 'number' ? health.readySessions : (typeof s?.readyCount === 'number' ? s.readyCount : (typeof s?.sessionCount === 'number' ? s.sessionCount : (svc?.SIMS ?? 0)));

          const uptimeStr = typeof health?.uptime === 'number' ? `${health.uptime} s` : (health?.uptime ? String(health.uptime) : null);
          const displayName = svc?.SISN ?? s?.SISN ?? `Server-${serverIndex}`;

          return {
            id: Number(svc?.SISEQ ?? s?.SISEQ),
            name: displayName,
            code: svc?.SITY ?? s?.SITY ?? displayName,
            type: svc?.SITY ?? s?.SITY ?? 'NORMAL',
            ip: svc?.SIIP ?? s?.SIIP ?? '0.0.0.0',
            port: svc?.SIPO ?? s?.SIPO ?? 5021,
            status,
            runMode: svc?.SIRM ?? s?.SIRM ?? 'N',
            maxSessions: svc?.SIMS ?? s?.SIMS ?? 100,
            activeSessions: readySessions,
            os: svc?.SIAF1 ?? s?.SIAF1 ?? null,
            uptime: uptimeStr,
            cpuUsage: cpuPercent,
            ramUsage: ramUsed,
            ramTotal: ramTotal,
            diskSpace: svc?.SIDE ?? s?.SIDE ?? null,
            lastCheck: svc?.SILC ? new Date(svc.SILC).toLocaleString('ar-YE') : (s?.SILC ? new Date(s.SILC).toLocaleString('ar-YE') : ''),
            location: svc?.SIAF2 ?? s?.SIAF2 ?? '',
            protocol: svc?.SIPT ?? s?.SIPT ?? 'HTTP',
            history: serverHistory[id] || [],
          } as ServerData;
        });
      });
  }, [rawServers, serverHistory]);

  const filteredServers = useMemo(() => {
    return servers.filter(
      (server) =>
        server.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        server.ip.includes(searchQuery) ||
        server.code.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [servers, searchQuery]);

  const handleSort = (key: keyof ServerData) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const sortedServers = useMemo(() => {
    return [...filteredServers].sort((a, b) => {
      const { key, direction } = sortConfig;
      let valA = a[key];
      let valB = b[key];

      if (valA === null || valA === undefined) valA = '' as any;
      if (valB === null || valB === undefined) valB = '' as any;

      if (valA < valB) return direction === 'asc' ? -1 : 1;
      if (valA > valB) return direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredServers, sortConfig]);

  const totalPages = Math.ceil(filteredServers.length / pageSize);
  const paginatedServers = useMemo(() => {
    return sortedServers.slice(
      (currentPage - 1) * pageSize,
      currentPage * pageSize
    );
  }, [sortedServers, currentPage, pageSize]);

  // Sparkline Component
  const SparklineChart = ({ data, color, dataKey }: { data: { cpu: number; ram: number }[], color: string, dataKey: 'cpu' | 'ram' }) => (
    <div className="h-8 w-16 opacity-50">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data.length > 0 ? data : [{ cpu: 0, ram: 0 }]}>
          <defs>
            <linearGradient id={`gradient-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.3}/>
              <stop offset="95%" stopColor={color} stopOpacity={0}/>
            </linearGradient>
          </defs>
          <Area 
            type="monotone" 
            dataKey={dataKey} 
            stroke={color} 
            fillOpacity={1} 
            fill={`url(#gradient-${dataKey})`} 
            strokeWidth={1.5}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );

  const handleAddServer = async () => {
    if (!newServer.SISN?.trim() || !newServer.SIIP?.trim()) {
      toast({ title: 'حقل مطلوب', description: 'يرجى إكمال الحقول الإجبارية', variant: 'destructive' });
      return;
    }

    setIsSubmittingServer(true);
    try {
      const payload = {
        ...newServer,
        SIPO: Number(newServer.SIPO),
        SIMS: Number(newServer.SIMS),
        SIAUY: Number(newServer.SIAUY),
        SIWE: Number(newServer.SIWE),
        SITMS: Number(newServer.SITMS),
        SIMC: Number(newServer.SIMC),
      };

      await addServer(payload, token || undefined);
      toast({ title: 'تمت الإضافة', description: 'تمت إضافة الخادم بنجاح' });
      setIsAddModalOpen(false);
      refetch();
    } catch (error: any) {
      toast({ title: 'خطأ', description: error.message || 'فشل إضافة الخادم', variant: 'destructive' });
    } finally {
      setIsSubmittingServer(false);
    }
  };

  const handleEditServer = async () => {
    if (!selectedServer || !token) return;
    setIsSubmittingEdit(true);
    try {
      const updateData: any = {
        SISN: selectedServer.name,
        SIIP: selectedServer.ip,
        SIPO: Number(selectedServer.port),
        SITY: selectedServer.type,
        SIRM: selectedServer.runMode,
        SIMS: Number(selectedServer.maxSessions),
      };
      await updateServer(selectedServer.id, updateData, token);
      toast({ title: 'تم التحديث', description: 'تم تحديث بيانات الخادم بنجاح' });
      setIsEditModalOpen(false);
      refetch();
    } catch (error: any) {
      toast({ title: 'خطأ', description: error.message || 'فشل تحديث الخادم', variant: 'destructive' });
    } finally {
      setIsSubmittingEdit(false);
    }
  };

  const handleRestartServer = (id: number) => {
    toast({ title: 'جاري العمل', description: `بدء إعادة تشغيل الخادم ${id}...` });
  };

  const handleDeleteServer = (server: ServerData) => {
    setServerToDelete(server);
    setIsDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!serverToDelete || !token) return;
    try {
      await deleteServer(serverToDelete.id, token);
      toast({ title: 'تم الحذف', description: 'تم حذف الخادم من النظام' });
      setIsDeleteConfirmOpen(false);
      refetch();
    } catch (error: any) {
      toast({ title: 'خطأ', description: error.message || 'فشل حذف الخادم', variant: 'destructive' });
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

  const getResourceStrokeColor = (usage: number) => {
    if (usage >= 81) return '#ef4444';
    if (usage >= 61) return '#f59e0b';
    return '#22c55e';
  };

  if (isLoading) return <PageLoader message="جاري تحميل بيانات الخوادم..." />;
  if (error) return <PageError onRetry={() => refetch()} />;

  return (
    <div className="space-y-8 max-w-[1600px] mx-auto">
      {/* Header */}
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
            <Button variant="outline" className="h-11 px-5 rounded-xl border-border/60 bg-background/50 hover:bg-muted/50 transition-all font-bold text-xs">
              <RefreshCw className="w-4 h-4 ml-2 text-muted-foreground" />
              إعادة تشغيل النظام
            </Button>
            <Button onClick={() => setIsAddModalOpen(true)} className="h-11 px-6 rounded-xl shadow-xl shadow-primary/20 hover:scale-[1.02] transition-all font-bold text-xs uppercase tracking-wider">
              <Plus className="w-4 h-4 ml-2" />
              إضافة خادم جديد
            </Button>
          </div>
        </div>
      </div>

      {/* Overview Stats */}
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
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">أداء المعالج</p>
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

      {/* Table/Cards Filter bar */}
      <div className="glass-panel p-2 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4 sticky top-4 z-40 shadow-xl shadow-black/5 ring-1 ring-black/5">
        <div className="relative w-full md:w-96">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
          <Input
            placeholder="البحث السريع..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pr-10 h-11 border-none bg-transparent focus-visible:ring-0 text-sm font-medium"
          />
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto px-4">
          <div className="flex items-center bg-muted/50 p-1 rounded-xl border border-border/50">
            <Button
              variant={viewMode === 'cards' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('cards')}
              className="h-8 px-3 rounded-lg text-xs font-bold gap-2"
            >
              <LayoutGrid className="w-3.5 h-3.5" /> بطاقات
            </Button>
            <Button
              variant={viewMode === 'table' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('table')}
              className="h-8 px-3 rounded-lg text-xs font-bold gap-2"
            >
              <TableIcon className="w-3.5 h-3.5" /> جدول
            </Button>
          </div>
          <div className="w-px h-6 bg-border/50 mx-1" />
          <div className="text-xs font-bold text-muted-foreground uppercase tracking-widest bg-muted/50 px-3 py-1.5 rounded-lg border border-border/50">
            النتائج: {filteredServers.length}
          </div>
        </div>
      </div>

      {/* Content View */}
      {viewMode === 'table' ? (
        <div className="data-table">
          <div className="overflow-x-auto">
            <table className="w-full text-right whitespace-nowrap">
              <thead>
                <tr className="bg-muted/30">
                  <th className="min-w-[80px] cursor-pointer hover:bg-muted" onClick={() => handleSort('id')}>
                    <div className="flex items-center gap-1">معرف <ArrowUpDown className="w-3 h-3" /></div>
                  </th>
                  <th className="min-w-[180px] cursor-pointer hover:bg-muted" onClick={() => handleSort('name')}>
                    <div className="flex items-center gap-1 text-[10px] uppercase font-black tracking-widest">اسم الخادم <ArrowUpDown className="w-3 h-3" /></div>
                  </th>
                  <th className="min-w-[120px] cursor-pointer hover:bg-muted" onClick={() => handleSort('status')}>
                    <div className="flex items-center gap-1 text-[10px] uppercase font-black tracking-widest">الحالة <ArrowUpDown className="w-3 h-3" /></div>
                  </th>
                  <th className="min-w-[150px]">عنوان IP</th>
                  <th className="min-w-[100px] cursor-pointer hover:bg-muted" onClick={() => handleSort('activeSessions')}>
                    <div className="flex items-center gap-1 text-[10px] uppercase font-black tracking-widest">الجلسات <ArrowUpDown className="w-3 h-3" /></div>
                  </th>
                  <th className="min-w-[120px] cursor-pointer hover:bg-muted" onClick={() => handleSort('cpuUsage')}>
                    <div className="flex items-center gap-1 text-[10px] uppercase font-black tracking-widest">CPU <ArrowUpDown className="w-3 h-3" /></div>
                  </th>
                  <th className="min-w-[120px] cursor-pointer hover:bg-muted" onClick={() => handleSort('ramUsage')}>
                    <div className="flex items-center gap-1 text-[10px] uppercase font-black tracking-widest">RAM <ArrowUpDown className="w-3 h-3" /></div>
                  </th>
                  <th className="min-w-[140px]">نظام التشغيل</th>
                  <th className="min-w-[140px]">الموقع</th>
                  <th className="min-w-[140px]">آخر فحص</th>
                  <th className="sticky left-0 bg-muted/50 text-[10px] uppercase font-black tracking-widest text-left px-4">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/20">
                {paginatedServers.map((server, index) => (
                  <motion.tr 
                    key={server.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.03 }}
                    className="hover:bg-muted/10 transition-colors group"
                  >
                    <td className="px-6 py-4 font-mono text-xs">{server.id}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${server.status === 'online' ? 'bg-success/10 text-success' : 'bg-muted text-muted-foreground'}`}>
                          <Server className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-foreground">{server.name}</p>
                          <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-primary/10 text-primary uppercase font-bold">{server.type}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={server.status} />
                    </td>
                    <td className="px-6 py-4 font-mono text-xs">{server.ip}:{server.port}</td>
                    <td className="px-6 py-4 font-bold text-xs">{server.activeSessions} / {server.maxSessions}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4 w-44">
                        <div className="flex flex-col gap-1 flex-1">
                          <div className="flex justify-between text-[9px] font-black uppercase">
                            <span className="text-muted-foreground">CPU</span>
                            <span className={getResourceTextColor(server.cpuUsage || 0)}>{Math.round(server.cpuUsage || 0)}%</span>
                          </div>
                          <div className="resource-progress">
                            <motion.div initial={{ width: 0 }} animate={{ width: `${server.cpuUsage || 0}%` }} className={`resource-progress-inner h-full ${getResourceColor(server.cpuUsage || 0)}`} />
                          </div>
                        </div>
                        {server.status === 'online' && <SparklineChart data={server.history || []} color={getResourceStrokeColor(server.cpuUsage || 0)} dataKey="cpu" />}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4 w-44">
                        <div className="flex flex-col gap-1 flex-1">
                          <div className="flex justify-between text-[9px] font-black uppercase">
                            <span className="text-muted-foreground">RAM</span>
                            <span className={getResourceTextColor((server.ramUsage || 0) / (server.ramTotal || 1) * 100)}>{Math.round((server.ramUsage || 0) / (server.ramTotal || 1) * 100)}%</span>
                          </div>
                          <div className="resource-progress">
                            <motion.div initial={{ width: 0 }} animate={{ width: `${(server.ramUsage || 0) / (server.ramTotal || 1) * 100}%` }} className={`resource-progress-inner h-full ${getResourceColor((server.ramUsage || 0) / (server.ramTotal || 1) * 100)}`} />
                          </div>
                        </div>
                        {server.status === 'online' && <SparklineChart data={server.history || []} color={getResourceStrokeColor((server.ramUsage || 0) / (server.ramTotal || 1) * 100)} dataKey="ram" />}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs text-muted-foreground">{server.os || 'N/A'}</td>
                    <td className="px-6 py-4 text-xs text-muted-foreground">{server.location || 'N/A'}</td>
                    <td className="px-6 py-4 font-mono text-[10px] opacity-60">{server.lastCheck}</td>
                    <td className="sticky left-0 bg-background/95 backdrop-blur-sm px-4 py-4 text-left">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg"><MoreHorizontal className="w-4 h-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="w-48">
                          <DropdownMenuItem className="gap-2" onClick={() => { setSelectedServer(server); setOriginalServerData(server); setIsEditModalOpen(true); }}><Edit2 className="w-4 h-4" /> تعديل</DropdownMenuItem>
                          <DropdownMenuItem className="gap-2" onClick={() => handleRestartServer(server.id)}><RefreshCw className="w-4 h-4" /> إعادة تشغيل</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive gap-2" onClick={() => handleDeleteServer(server)}><Trash2 className="w-4 h-4" /> حذف</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="grid gap-6 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
          {paginatedServers.map((server, index) => (
            <motion.div key={server.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: index * 0.05 }} className="premium-card group relative">
              <div className="p-5 border-b border-border/40 bg-muted/5">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2.5 rounded-xl ${server.status === 'online' ? 'bg-success/10 text-success' : 'bg-muted text-muted-foreground'}`}><Server className="w-5 h-5" /></div>
                    <div>
                      <h3 className="font-bold text-foreground tracking-tight flex items-center gap-2">
                        {server.name}
                        <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-primary/10 text-primary uppercase font-bold">{server.type}</span>
                      </h3>
                      <div className="flex items-center gap-1.5 mt-1">
                        <div className={`w-1.5 h-1.5 rounded-full ${server.status === 'online' ? 'bg-success animate-pulse' : 'bg-muted'}`} />
                        <span className="text-[10px] font-bold text-muted-foreground uppercase">{getStatusLabel(server.status)}</span>
                        <span className="text-[10px] font-mono text-muted-foreground ml-2" dir="ltr">{server.ip}:{server.port}</span>
                      </div>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-muted/80"><MoreVertical className="w-4 h-4 text-muted-foreground" /></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem className="gap-2 py-2" onClick={() => { setSelectedServer(server); setIsEditModalOpen(true); }}><Edit className="w-4 h-4" /> تعديل</DropdownMenuItem>
                      <DropdownMenuItem className="gap-2 py-2" onClick={() => handleRestartServer(server.id)}><RefreshCw className="w-4 h-4" /> إعادة التشغيل</DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="gap-2 py-2 text-destructive font-medium" onClick={() => handleDeleteServer(server)}><Trash2 className="w-4 h-4" /> حذف الخادم</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              <div className="p-5 space-y-6">
                {server.status === 'online' && server.cpuUsage != null && server.ramUsage != null && server.ramTotal != null ? (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between items-end text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5"><Cpu className="w-3 h-3" /> CPU %</div>
                          <span className={`text-base font-black ${getResourceTextColor(server.cpuUsage)}`}>{Math.round(server.cpuUsage)}%</span>
                        </div>
                        <SparklineChart data={server.history || []} color={getResourceStrokeColor(server.cpuUsage)} dataKey="cpu" />
                      </div>
                      <div className="resource-progress"><motion.div initial={{ width: 0 }} animate={{ width: `${server.cpuUsage}%` }} className={`resource-progress-inner ${getResourceColor(server.cpuUsage)}`} /></div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between items-end text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5"><HardDrive className="w-3 h-3" /> RAM %</div>
                          <span className={`text-base font-black ${getResourceTextColor((server.ramUsage / server.ramTotal) * 100)}`}>{Math.round((server.ramUsage / server.ramTotal) * 100)}%</span>
                        </div>
                        <SparklineChart data={server.history || []} color={getResourceStrokeColor((server.ramUsage / server.ramTotal) * 100)} dataKey="ram" />
                      </div>
                      <div className="resource-progress"><motion.div initial={{ width: 0 }} animate={{ width: `${(server.ramUsage / server.ramTotal) * 100}%` }} className={`resource-progress-inner ${getResourceColor((server.ramUsage / server.ramTotal) * 100)}`} /></div>
                    </div>
                  </div>
                ) : (
                  <div className="p-8 text-center rounded-xl bg-muted/10 border border-dashed border-border/40 flex flex-col items-center gap-3">
                    <AlertTriangle className="w-6 h-6 text-muted-foreground/40" />
                    <p className="text-[11px] font-bold text-muted-foreground">الخادم غير متاح حالياً</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-2.5 rounded-xl bg-muted/30 border border-border/20">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-1.5 mb-1.5"><Database className="w-3 h-3 text-primary/70" /> الجلسات</p>
                    <p className="text-sm font-bold">{server.activeSessions} <span className="text-[10px] text-muted-foreground font-normal">/ {server.maxSessions}</span></p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-muted/30 border border-border/20">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-1.5 mb-1.5"><Activity className="w-3 h-3 text-primary/70" /> النمط</p>
                    <p className="text-sm font-bold">{server.runMode}</p>
                  </div>
                </div>

                <div className="space-y-3 pt-4 border-t border-border/40 text-[10px]">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground font-bold">وقت التشغيل</span>
                    <span className="font-mono">{server.uptime || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground font-bold">آخر فحص</span>
                    <span className="font-mono text-primary font-bold">{server.lastCheck}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Pagination */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-6 border-t border-border/50">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">عرض</span>
            <Select value={pageSize.toString()} onValueChange={(v) => { setPageSize(Number(v)); setCurrentPage(1); }}>
              <SelectTrigger className="w-20 h-9 bg-card">
                <SelectValue />
              </SelectTrigger>
              <SelectContent dir="rtl">
                <SelectItem value="20">20</SelectItem>
                <SelectItem value="25">25</SelectItem>
                <SelectItem value="50">50</SelectItem>
              </SelectContent>
            </Select>
            <span className="text-sm text-muted-foreground">خادم بكل صفحة</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} disabled={currentPage === 1} className="h-9 px-3 bg-card border-border/60 hover:bg-muted/50">
            <ChevronRight className="w-4 h-4 ml-1" /> السابق
          </Button>
          <div className="flex items-center gap-1 px-4 text-sm font-medium"><span>صفحة {currentPage} من {totalPages}</span></div>
          <Button variant="outline" size="sm" onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))} disabled={currentPage === totalPages || totalPages === 0} className="h-9 px-3 bg-card border-border/60 hover:bg-muted/50">
            التالي <ChevronLeft className="w-4 h-4 mr-1" />
          </Button>
        </div>
      </div>

      {/* Modals - Expanded to match Style */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="text-xl font-bold">إضافة خادم جديد</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="space-y-2"><Label className="text-xs font-bold text-muted-foreground uppercase">رمز الخادم * (Server Name)</Label>
              <Input value={newServer.SISN} onChange={(e) => setNewServer({ ...newServer, SISN: e.target.value })} placeholder="SER1, SER2, ..." />
            </div>
            <div className="space-y-2"><Label className="text-xs font-bold text-muted-foreground uppercase">نوع الخدمة</Label>
              <Select value={newServer.SITY} onValueChange={(v) => setNewServer({ ...newServer, SITY: v })}>
                <SelectTrigger className="bg-background"><SelectValue placeholder="اختر النوع" /></SelectTrigger>
                <SelectContent dir="rtl">
                  <SelectItem value="NORMAL">NORMAL</SelectItem>
                  <SelectItem value="EMA_v2">EMA_v2</SelectItem>
                  <SelectItem value="GFA">GFA</SelectItem>
                  <SelectItem value="CONTROL">CONTROL</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label className="text-xs font-bold text-muted-foreground uppercase">عنوان IP *</Label>
              <Input value={newServer.SIIP} onChange={(e) => setNewServer({ ...newServer, SIIP: e.target.value })} placeholder="192.168.1.1" dir="ltr" />
            </div>
            <div className="space-y-2"><Label className="text-xs font-bold text-muted-foreground uppercase">المنفذ * (Port)</Label>
              <Input type="number" value={newServer.SIPO} onChange={(e) => setNewServer({ ...newServer, SIPO: e.target.value })} dir="ltr" />
            </div>
            <div className="space-y-2"><Label className="text-xs font-bold text-muted-foreground uppercase">البروتوكول</Label>
              <Select value={newServer.SIPT} onValueChange={(v) => setNewServer({ ...newServer, SIPT: v })}>
                <SelectTrigger className="bg-background"><SelectValue /></SelectTrigger>
                <SelectContent dir="rtl">
                  <SelectItem value="HTTP">HTTP</SelectItem>
                  <SelectItem value="HTTPS">HTTPS</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label className="text-xs font-bold text-muted-foreground uppercase">الحد الأقصى للجلسات</Label>
              <Input type="number" value={newServer.SIMS} onChange={(e) => setNewServer({ ...newServer, SIMS: e.target.value })} />
            </div>
            <div className="space-y-2"><Label className="text-xs font-bold text-muted-foreground uppercase">نمط التشغيل</Label>
              <Select value={newServer.SIRM} onValueChange={(v) => setNewServer({ ...newServer, SIRM: v })}>
                <SelectTrigger className="bg-background"><SelectValue /></SelectTrigger>
                <SelectContent dir="rtl">
                  <SelectItem value="N">Normal (N)</SelectItem>
                  <SelectItem value="M">Mirror (M)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label className="text-xs font-bold text-muted-foreground uppercase">حالة الخدمة</Label>
              <Select value={newServer.SIST.toString()} onValueChange={(v) => setNewServer({ ...newServer, SIST: parseInt(v) })}>
                <SelectTrigger className="bg-background"><SelectValue /></SelectTrigger>
                <SelectContent dir="rtl">
                  <SelectItem value="1">مفعلة</SelectItem>
                  <SelectItem value="0">معطلة</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setIsAddModalOpen(false)}>إلغاء</Button>
            <Button onClick={handleAddServer} disabled={isSubmittingServer} className="px-8 shadow-lg shadow-primary/20">
              {isSubmittingServer ? <Loader2 className="w-4 h-4 ml-2 animate-spin" /> : 'حفظ الخادم'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader><DialogTitle className="text-xl font-bold">تعديل بيانات الخادم</DialogTitle></DialogHeader>
          {selectedServer && (
            <div className="grid grid-cols-2 gap-4 py-4">
              <div className="col-span-2 space-y-2"><Label className="text-xs font-bold text-muted-foreground uppercase">اسم الخادم</Label>
                <Input value={selectedServer.name} onChange={(e) => setSelectedServer({ ...selectedServer, name: e.target.value })} />
              </div>
              <div className="space-y-2"><Label className="text-xs font-bold text-muted-foreground uppercase">عنوان IP</Label>
                <Input value={selectedServer.ip} onChange={(e) => setSelectedServer({ ...selectedServer, ip: e.target.value })} dir="ltr" />
              </div>
              <div className="space-y-2"><Label className="text-xs font-bold text-muted-foreground uppercase">المنفذ</Label>
                <Input type="number" value={selectedServer.port} onChange={(e) => setSelectedServer({ ...selectedServer, port: Number(e.target.value) })} dir="ltr" />
              </div>
            </div>
          )}
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>إلغاء</Button>
            <Button onClick={handleEditServer} disabled={isSubmittingEdit} className="px-8 shadow-lg shadow-primary/20">
              {isSubmittingEdit ? <Loader2 className="w-4 h-4 ml-2 animate-spin" /> : 'تحديث'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader><DialogTitle className="text-xl font-bold text-destructive">تأكيد الحذف</DialogTitle>
            <DialogDescription>هل أنت متأكد من حذف الخادم <span className="font-bold">{serverToDelete?.name}</span>؟</DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setIsDeleteConfirmOpen(false)}>إلغاء</Button>
            <Button variant="destructive" onClick={handleConfirmDelete} className="px-8">حذف</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}