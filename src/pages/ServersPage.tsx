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
import { useQuery } from '@tanstack/react-query';
import { getServers, addServer, deleteServer } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';

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
  const [jitter, setJitter] = useState({ cpu: 0, ram: 0 });
  const [deletingServerId, setDeletingServerId] = useState<number | null>(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [serverToDelete, setServerToDelete] = useState<ServerData | null>(null);

  const { toast } = useToast();
  const { accessToken: token } = useAuthStore();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['servers'],
    queryFn: getServers,
    refetchInterval: 15000, // Refresh every 15s for better chart feel (SRV-002)
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
              next[id] = [...currentHistory, { cpu, ram }].slice(-10); // Keep last 10 points
            }
          });
        });
        return next;
      });
    }
  }, [data]);

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
    .flatMap((s: any, serverIndex: number) => {
      // Extract all services or fallback to the server object itself
      const services = Array.isArray(s.services) && s.services.length > 0 ? s.services : [s];
      
      return services.map((svc: any, svcIndex: number) => {
        const id = svc?.SISEQ ?? s?.SISEQ ?? `${serverIndex}-${svcIndex}`;
        const health = svc?.health ?? s?.health ?? null;

        // Determine status: if health is explicitly null -> shutdown, otherwise check SIST
        const status = health === null ? 'shutdown' : ((svc?.SIST ?? s?.SIST) === 1 ? 'online' : 'offline');

        // Use only API-provided metrics. If missing, keep null/undefined so UI can hide them.
        const cpuPercent: number | null = typeof health?.cpuPercent === 'number' ? health.cpuPercent : null;
        const ramUsed: number | null = typeof health?.memory?.usedGB === 'number' ? health.memory.usedGB : null;
        const ramTotal: number | null = typeof health?.memory?.totalGB === 'number' ? health.memory.totalGB : null;
        const readySessions: number = typeof health?.readySessions === 'number' ? health.readySessions : (typeof s?.readyCount === 'number' ? s.readyCount : (typeof s?.sessionCount === 'number' ? s.sessionCount : (svc?.SIMS ?? 0)));

        const uptimeStr = typeof health?.uptime === 'number' ? `${health.uptime} s` : (health?.uptime ? String(health.uptime) : null);

        // Derive the name - if it's a sub-service, we might want to show both parent and sub-service name or just service name
        // Based on user JSON: Parent SISN is "SER2", Service SISN is also "SER2". SITY is "EMA_v2" vs "FGA".
        const displayName = svc?.SISN ?? s?.SISN ?? `Server-${serverIndex}`;

        return {
          id: svc?.SISEQ ?? s?.SISEQ ?? `${serverIndex}-${svcIndex}`,
          name: displayName,
          code: svc?.SITY ?? s?.SITY ?? displayName, // Use SITY as a code for better identification
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
        };
      });
    });

  const filteredServers = servers.filter(
    (server) =>
      server.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      server.ip.includes(searchQuery) ||
      server.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSort = (key: keyof ServerData) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const sortedServers = [...filteredServers].sort((a, b) => {
    const { key, direction } = sortConfig;
    let valA = a[key];
    let valB = b[key];

    if (valA === null || valA === undefined) valA = '' as any;
    if (valB === null || valB === undefined) valB = '' as any;

    if (valA < valB) return direction === 'asc' ? -1 : 1;
    if (valA > valB) return direction === 'asc' ? 1 : -1;
    return 0;
  });

  const totalPages = Math.ceil(filteredServers.length / pageSize);
  const paginatedServers = sortedServers.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  // Sparkline Component for real-time vibe (SRV-002)
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
    // Validation
    if (!newServer.SISN?.trim()) {
      toast({ 
        title: 'حقل مطلوب', 
        description: 'يرجى إدخال رمز الخادم (Server Name)',
        variant: 'destructive'
      });
      return;
    }

    if (!newServer.SIIP?.trim()) {
      toast({ 
        title: 'حقل مطلوب', 
        description: 'يرجى إدخال عنوان IP',
        variant: 'destructive'
      });
      return;
    }

    // Basic IP Validation
    const ipRegex = /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/;
    if (!ipRegex.test(newServer.SIIP)) {
      toast({ 
        title: 'خطأ في التحقق', 
        description: 'يرجى إدخال عنوان IP صحيح (مثال: 192.168.1.1)',
        variant: 'destructive'
      });
      return;
    }

    if (!newServer.SIPO || isNaN(parseInt(newServer.SIPO as any))) {
      toast({ 
        title: 'حقل مطلوب', 
        description: 'يرجى إدخال رقم منفذ صحيح',
        variant: 'destructive'
      });
      return;
    }

    if (!token) {
      toast({ 
        title: 'خطأ', 
        description: 'انتهت الجلسة، يرجى تسجيل الدخول مجدداً',
        variant: 'destructive'
      });
      return;
    }

    setIsSubmittingServer(true);

    try {
      const serverPayload = {
        SISN: newServer.SISN.trim(),
        SITY: newServer.SITY,
        SIIP: newServer.SIIP.trim(),
        SIPO: parseInt(newServer.SIPO as any),
        SIPT: newServer.SIPT,
        SIST: newServer.SIST,
        SIRM: newServer.SIRM,
        SIRT: newServer.SIRT,
        SIMS: parseInt(newServer.SIMS as any),
        SIAUY: parseInt(newServer.SIAUY as any),
        SIWE: parseInt(newServer.SIWE as any),
        SITMS: parseInt(newServer.SITMS as any),
        SIMC: parseInt(newServer.SIMC as any),
        ...(newServer.SIDE && { SIDE: newServer.SIDE.trim() }),
        ...(newServer.SIAF1 && { SIAF1: newServer.SIAF1.trim() }),
        ...(newServer.SIAF2 && { SIAF2: newServer.SIAF2.trim() }),
      };

      const response = await addServer(serverPayload, token);

      if (response.status) {
        toast({ 
          title: 'تمت الإضافة بنجاح', 
          description: `تمت إضافة الخادم ${newServer.SISN} بنجاح`,
          variant: 'default'
        });
        
        setIsAddModalOpen(false);
        
        // Reset form
        setNewServer({ 
          SISN: '',
          SITY: 'NORMAL',
          SIIP: '',
          SIPO: '5021',
          SIPT: 'HTTP',
          SIST: 1,
          SIRM: 'N',
          SIRT: 'PATH',
          SIMS: '250',
          SIAUY: '2',
          SIWE: '1',
          SITMS: '15000',
          SIMC: '100',
          SIDE: '',
          SIAF1: '',
          SIAF2: '',
        });

        // Refresh servers list
        refetch();
      } else {
        toast({ 
          title: 'خطأ', 
          description: response.message || 'فشل في إضافة الخادم',
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({ 
        title: 'خطأ', 
        description: error instanceof Error ? error.message : 'حدث خطأ أثناء إضافة الخادم',
        variant: 'destructive'
      });
    } finally {
      setIsSubmittingServer(false);
    }
  };

  const handleEditServer = () => {
    // In a real app, this would be an API call
    toast({ title: 'ميزة تعديل خادم ستتوفر قريباً عبر الـ API' });
    setIsEditModalOpen(false);
  };

  const handleDeleteServer = (id: number) => {
    // Find the server to get its details
    const server = servers.find(s => s.id === id);
    if (server) {
      setServerToDelete(server);
      setIsDeleteConfirmOpen(true);
    }
  };

  const handleConfirmDelete = async () => {
    if (!serverToDelete || !token) {
      toast({ 
        title: 'خطأ', 
        description: 'معلومات الخادم غير متوفرة',
        variant: 'destructive'
      });
      return;
    }

    setDeletingServerId(serverToDelete.id as number);

    try {
      const response = await deleteServer(serverToDelete.id as number, token);

      if (response.status) {
        toast({ 
          title: 'تم الحذف بنجاح', 
          description: `تم حذف الخادم ${serverToDelete.name} بنجاح`,
          variant: 'default'
        });
        
        setIsDeleteConfirmOpen(false);
        setServerToDelete(null);
        
        // Refresh servers list
        refetch();
      } else {
        toast({ 
          title: 'خطأ', 
          description: response.message || 'فشل في حذف الخادم',
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({ 
        title: 'خطأ', 
        description: error instanceof Error ? error.message : 'حدث خطأ أثناء حذف الخادم',
        variant: 'destructive'
      });
    } finally {
      setDeletingServerId(null);
    }
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

  const getResourceStrokeColor = (usage: number) => {
    if (usage >= 81) return '#ef4444';
    if (usage >= 61) return '#f59e0b';
    return '#22c55e';
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
          <div className="flex items-center bg-muted/50 p-1 rounded-xl border border-border/50">
            <Button
              variant={viewMode === 'cards' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('cards')}
              className="h-8 px-3 rounded-lg text-xs font-bold gap-2"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              بطاقات
            </Button>
            <Button
              variant={viewMode === 'table' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('table')}
              className="h-8 px-3 rounded-lg text-xs font-bold gap-2"
            >
              <TableIcon className="w-3.5 h-3.5" />
              جدول
            </Button>
          </div>
          <div className="w-px h-6 bg-border/50 mx-1" />
          <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-widest px-3 py-1.5 rounded-lg bg-muted/50 border border-border/50">
            <span>النتائج: {filteredServers.length}</span>
          </div>
        </div>
      </div>


      {/* Server Grid / Table */}
      {viewMode === 'table' ? (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="data-table"
        >
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
                  <th className="min-w-[140px]">الموقع والكود</th>
                  <th className="min-w-[140px]">آخر فحص</th>
                  <th className="min-w-[100px]">البروتوكول</th>
                  <th className="sticky left-0 z-10 bg-muted/50 text-[10px] uppercase font-black tracking-widest text-left" style={{ backgroundColor: "oklch(96.8% 0.007 247.896)" }}>
                    إجراءات
                  </th>
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
                          <div className="flex items-center gap-1.5">
                            <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-primary/10 text-primary uppercase font-bold tracking-tighter">
                              {server.type}
                            </span>
                            <span className="text-[9px] font-bold text-muted-foreground/60 uppercase">{server.runMode}</span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={server.status === 'online' ? 'active' : 'inactive'} />
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-xs font-mono text-muted-foreground" dir="ltr">{server.ip}:{server.port}</p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold">{server.activeSessions}</span>
                        <span className="text-muted-foreground/30">/</span>
                        <span className="text-xs text-muted-foreground/60">{server.maxSessions}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4 w-44">
                        <div className="flex flex-col gap-1 flex-1">
                          <div className="flex justify-between text-[9px] font-black uppercase">
                            <span className="text-muted-foreground">CPU</span>
                            <span className={getResourceTextColor(server.cpuUsage || 0)}>{Math.round(server.cpuUsage || 0)}%</span>
                          </div>
                          <div className="resource-progress overflow-hidden h-1">
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${server.cpuUsage || 0}%` }}
                              className={`resource-progress-inner h-full ${getResourceColor(server.cpuUsage || 0)}`}
                            />
                          </div>
                        </div>
                        {server.status === 'online' && (
                          <SparklineChart 
                            data={server.history || []} 
                            color={getResourceStrokeColor(server.cpuUsage || 0)} 
                            dataKey="cpu" 
                          />
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4 w-44">
                        <div className="flex flex-col gap-1 flex-1">
                          <div className="flex justify-between text-[9px] font-black uppercase">
                            <span className="text-muted-foreground">RAM</span>
                            <span className={getResourceTextColor((server.ramUsage || 0) / (server.ramTotal || 1) * 100)}>
                              {Math.round((server.ramUsage || 0) / (server.ramTotal || 1) * 100)}%
                            </span>
                          </div>
                          <div className="resource-progress overflow-hidden h-1">
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${(server.ramUsage || 0) / (server.ramTotal || 1) * 100}%` }}
                              className={`resource-progress-inner h-full ${getResourceColor((server.ramUsage || 0) / (server.ramTotal || 1) * 100)}`}
                            />
                          </div>
                          <div className="flex justify-between text-[8px] text-muted-foreground/50 font-mono mt-0.5">
                            <span>{(server.ramUsage || 0).toFixed(1)}GB</span>
                            <span>/ {(server.ramTotal || 1)}GB</span>
                          </div>
                        </div>
                        {server.status === 'online' && (
                          <SparklineChart 
                            data={server.history || []} 
                            color={getResourceStrokeColor((server.ramUsage || 0) / (server.ramTotal || 1) * 100)} 
                            dataKey="ram" 
                          />
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <span className="text-xs text-muted-foreground/80">{server.os || 'N/A'}</span>
                        <span className="text-[9px] text-muted-foreground/40 font-mono uppercase tracking-tighter">
                          {server.uptime || '0s uptime'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <span className="text-xs text-muted-foreground/80">{server.location || 'N/A'}</span>
                        <span className="text-[9px] text-muted-foreground/40 font-mono uppercase tracking-tighter">
                          {server.code}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-[10px] font-mono whitespace-nowrap opacity-60">{server.lastCheck}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-[10px] font-bold text-muted-foreground bg-muted/50 px-2 py-0.5 rounded border border-border/10 uppercase tracking-widest">
                        {server.protocol}
                      </span>
                    </td>
                    <td className="sticky left-0 bg-background/95 backdrop-blur-sm border-r px-4 py-4 text-left">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="w-48">
                          <DropdownMenuItem className="gap-2" onClick={() => { setSelectedServer(server); setIsEditModalOpen(true); }}>
                            <Edit2 className="w-4 h-4" />
                            تعديل
                          </DropdownMenuItem>
                          <DropdownMenuItem className="gap-2" onClick={() => handleRestartServer(server.id)}>
                            <RefreshCw className="w-4 h-4" />
                            إعادة تشغيل
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive gap-2" onClick={() => handleDeleteServer(server.id)}>
                            <Trash2 className="w-4 h-4" />
                            حذف
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      ) : (
        <div className="grid gap-6 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
          {paginatedServers.map((server, index) => (
            <motion.div
              key={server.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
              className="premium-card group relative"
            >
                <>
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
                              {server.type}
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
                            <span className="text-[10px] font-mono text-muted-foreground" dir="ltr">{server.ip}:{server.port}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-[9px] font-mono text-muted-foreground/50 bg-muted/30 px-1.5 py-0.5 rounded">
                          ID: {server.id}
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
                  </div>

                  <div className="p-5 space-y-6">
                    {server.status === 'online' && server.cpuUsage != null && server.ramUsage != null && server.ramTotal != null ? (
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <div className="flex justify-between items-end text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">
                            <div className="space-y-1">
                              <div className="flex items-center gap-1.5">
                                <Cpu className="w-3 h-3" />
                                استهلاك المعالج (CPU %)
                              </div>
                              <span className={`text-base font-black ${getResourceTextColor(server.cpuUsage)}`}>
                                {Math.round(server.cpuUsage)}%
                              </span>
                            </div>
                            <SparklineChart 
                              data={server.history || []} 
                              color={getResourceStrokeColor(server.cpuUsage)} 
                              dataKey="cpu" 
                            />
                          </div>
                          <div className="resource-progress overflow-hidden">
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${server.cpuUsage}%` }}
                              className={`resource-progress-inner ${getResourceColor(server.cpuUsage)}`}
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="flex justify-between items-end text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">
                            <div className="space-y-1">
                              <div className="flex items-center gap-1.5">
                                <HardDrive className="w-3 h-3" />
                                استهلاك الذاكرة (RAM %)
                              </div>
                              <span className={`text-base font-black ${getResourceTextColor((server.ramUsage / server.ramTotal) * 100)}`}>
                                {Math.round((server.ramUsage / server.ramTotal) * 100)}%
                              </span>
                            </div>
                            <SparklineChart 
                              data={server.history || []} 
                              color={getResourceStrokeColor((server.ramUsage / server.ramTotal) * 100)} 
                              dataKey="ram" 
                            />
                          </div>
                          <div className="resource-progress overflow-hidden">
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
                      <div className="p-8 text-center rounded-xl bg-muted/10 border border-dashed border-border/40 flex flex-col items-center gap-3">
                        <AlertTriangle className="w-6 h-6 text-muted-foreground/40" />
                        <p className="text-[11px] font-bold text-muted-foreground max-w-[180px]">الخادم غير متاح حالياً - تم إيقاف المراقبة الحية للموارد</p>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-4 pb-2">
                      <div className="p-2.5 rounded-xl bg-muted/30 border border-border/20 transition-colors">
                        <p className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-1.5 mb-1.5">
                          <Database className="w-3 h-3 text-primary/70" />
                          الجلسات (نشطة/مسموحة)
                        </p>
                        <p className="text-sm font-bold text-foreground">
                          {server.activeSessions} <span className="text-[10px] text-muted-foreground font-normal">/ {server.maxSessions}</span>
                        </p>
                      </div>
                      <div className="p-2.5 rounded-xl bg-muted/30 border border-border/20 transition-colors">
                        <p className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-1.5 mb-1.5">
                          <Activity className="w-3 h-3 text-primary/70" />
                          نوع السيرفر
                        </p>
                        <p className="text-sm font-bold text-foreground">{server.runMode}</p>
                      </div>
                      <div className="p-2.5 rounded-xl bg-muted/30 border border-border/20 transition-colors">
                        <p className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-1.5 mb-1.5">
                          <Monitor className="w-3 h-3 text-primary/70" />
                          نظام التشغيل (OS)
                        </p>
                        <p className="text-[11px] font-bold text-foreground truncate">{server.os || 'غير معروف'}</p>
                      </div>
                      <div className="p-2.5 rounded-xl bg-muted/30 border border-border/20 transition-colors">
                        <p className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-1.5 mb-1.5">
                          <Shield className="w-3 h-3 text-primary/70" />
                          البروتوكول
                        </p>
                        <p className="text-sm font-bold text-foreground">{server.protocol}</p>
                      </div>
                    </div>

                    <div className="space-y-3 pt-4 border-t border-border/40">
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="text-muted-foreground font-bold uppercase tracking-widest px-2 py-0.5 rounded bg-muted/30 border border-border/10">وقت التشغيل (Uptime)</span>
                        <span className="font-mono text-foreground font-bold">{server.uptime || 'N/A'}</span>
                      </div>
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="text-muted-foreground font-bold uppercase tracking-widest px-2 py-0.5 rounded bg-muted/30 border border-border/10">آخر فحص (Last Check)</span>
                        <span className="font-mono text-primary font-bold">{server.lastCheck}</span>
                      </div>
                      <div className="flex items-center justify-between text-[10px] mt-2 pt-3 border-t border-border/10">
                        <span className="text-muted-foreground font-bold uppercase tracking-widest">رمز الخادم</span>
                        <span className="font-mono text-muted-foreground/60">{server.code}</span>
                      </div>
                    </div>
                  </div>
                </>
              
              {server.status === 'online' && (server.cpuUsage > 80 || (server.ramUsage / (server.ramTotal || 1)) > 0.85) && (
                <div className="absolute inset-0 rounded-2xl border-2 border-destructive animate-pulse pointer-events-none z-10" />
              )}
            </motion.div>
          ))}
        </div>
      )}


      {filteredServers.length === 0 && (
        <div className="p-20 text-center glass-panel rounded-3xl border border-dashed border-border/40 flex flex-col items-center justify-center">
          <div className="w-20 h-20 rounded-full bg-muted/20 flex items-center justify-center mb-6">
            <Server className="w-10 h-10 text-muted-foreground/30" />
          </div>
          <h3 className="text-lg font-bold text-foreground">لا توجد خوادم متاحة</h3>
          <p className="text-sm text-muted-foreground mt-2 max-w-sm">لم نتمكن من العثور على أي خوادم تطابق معايير البحث الحالية.</p>
          <Button variant="link" onClick={() => setSearchQuery('')} className="mt-4 text-primary font-bold">
            مسح فلاتر البحث
          </Button>
        </div>
      )}


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
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">إضافة خادم جديد</DialogTitle>
            <DialogDescription>أدخل معلومات الخادم الجديد لتشغيل الخدمات عليه. جميع الحقول المشار إليها بـ * مطلوبة.</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            {/* Row 1: Server Name & Server Type */}
            <div className="space-y-2">
              <Label className="text-xs font-bold text-muted-foreground uppercase">رمز الخادم * (Server Name)</Label>
              <Input
                value={newServer.SISN}
                onChange={(e) => setNewServer({ ...newServer, SISN: e.target.value })}
                placeholder="SER1, SER2, ..."
                disabled={isSubmittingServer}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold text-muted-foreground uppercase">نوع الخدمة</Label>
              <Select value={newServer.SITY} onValueChange={(v) => setNewServer({ ...newServer, SITY: v })} disabled={isSubmittingServer}>
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder="اختر النوع" />
                </SelectTrigger>
                <SelectContent dir="rtl">
                  <SelectItem value="NORMAL">NORMAL</SelectItem>
                  <SelectItem value="V2">V2</SelectItem>
                  <SelectItem value="V3">V3</SelectItem>
                  <SelectItem value="GFA">GFA</SelectItem>
                  <SelectItem value="EMA_v2">EMA_v2</SelectItem>
                  <SelectItem value="CONTROL">CONTROL</SelectItem>
                  <SelectItem value="M">M</SelectItem>
                  <SelectItem value="B">B</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Row 2: IP & Port */}
            <div className="space-y-2">
              <Label className="text-xs font-bold text-muted-foreground uppercase">عنوان IP * (إجباري)</Label>
              <Input
                value={newServer.SIIP}
                onChange={(e) => setNewServer({ ...newServer, SIIP: e.target.value })}
                placeholder="192.168.1.1"
                dir="ltr"
                disabled={isSubmittingServer}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold text-muted-foreground uppercase">المنفذ * (Port)</Label>
              <Input
                type="number"
                value={newServer.SIPO}
                onChange={(e) => setNewServer({ ...newServer, SIPO: e.target.value })}
                placeholder="5021"
                dir="ltr"
                disabled={isSubmittingServer}
              />
            </div>

            {/* Row 3: Protocol & Max Sessions */}
            <div className="space-y-2">
              <Label className="text-xs font-bold text-muted-foreground uppercase">البروتوكول</Label>
              <Select value={newServer.SIPT} onValueChange={(v) => setNewServer({ ...newServer, SIPT: v })} disabled={isSubmittingServer}>
                <SelectTrigger className="bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent dir="rtl">
                  <SelectItem value="HTTP">HTTP</SelectItem>
                  <SelectItem value="HTTPS">HTTPS</SelectItem>
                  <SelectItem value="TCP">TCP</SelectItem>
                  <SelectItem value="UDP">UDP</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold text-muted-foreground uppercase">الحد الأقصى للجلسات (رقم)</Label>
              <Input
                type="number"
                value={newServer.SIMS}
                onChange={(e) => setNewServer({ ...newServer, SIMS: e.target.value })}
                placeholder="250"
                disabled={isSubmittingServer}
              />
            </div>

            {/* Row 4: Run Mode & Routing Type */}
            <div className="space-y-2">
              <Label className="text-xs font-bold text-muted-foreground uppercase">نمط التشغيل</Label>
              <Select value={newServer.SIRM} onValueChange={(v) => setNewServer({ ...newServer, SIRM: v })} disabled={isSubmittingServer}>
                <SelectTrigger className="bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent dir="rtl">
                  <SelectItem value="N">Normal (N)</SelectItem>
                  <SelectItem value="C">Cache (C)</SelectItem>
                  <SelectItem value="M">Mirror (M)</SelectItem>
                  <SelectItem value="A">Advanced (A)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold text-muted-foreground uppercase">نوع التوجيه</Label>
              <Select value={newServer.SIRT} onValueChange={(v) => setNewServer({ ...newServer, SIRT: v })} disabled={isSubmittingServer}>
                <SelectTrigger className="bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent dir="rtl">
                  <SelectItem value="PATH">PATH</SelectItem>
                  <SelectItem value="HOST">HOST</SelectItem>
                  <SelectItem value="REGEX">REGEX</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Row 5: Authentication & Server Status */}
            <div className="space-y-2">
              <Label className="text-xs font-bold text-muted-foreground uppercase">المصادقة مطلوبة؟</Label>
              <Select value={newServer.SIAUY?.toString()} onValueChange={(v) => setNewServer({ ...newServer, SIAUY: v })} disabled={isSubmittingServer}>
                <SelectTrigger className="bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent dir="rtl">
                  <SelectItem value="1">نعم (Yes)</SelectItem>
                  <SelectItem value="2">لا (No)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold text-muted-foreground uppercase">حالة الخدمة</Label>
              <Select value={newServer.SIST?.toString()} onValueChange={(v) => setNewServer({ ...newServer, SIST: parseInt(v) })} disabled={isSubmittingServer}>
                <SelectTrigger className="bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent dir="rtl">
                  <SelectItem value="1">مفعلة (Active)</SelectItem>
                  <SelectItem value="0">معطلة (Inactive)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Row 6: Timeout & Max Connections */}
            <div className="space-y-2">
              <Label className="text-xs font-bold text-muted-foreground uppercase">مهلة الاتصال (ms)</Label>
              <Input
                type="number"
                value={newServer.SITMS}
                onChange={(e) => setNewServer({ ...newServer, SITMS: e.target.value })}
                placeholder="15000"
                disabled={isSubmittingServer}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold text-muted-foreground uppercase">الحد الأقصى للاتصالات</Label>
              <Input
                type="number"
                value={newServer.SIMC}
                onChange={(e) => setNewServer({ ...newServer, SIMC: e.target.value })}
                placeholder="100"
                disabled={isSubmittingServer}
              />
            </div>

            {/* Row 7: Server Weight */}
            <div className="space-y-2">
              <Label className="text-xs font-bold text-muted-foreground uppercase">وزن السيرفر</Label>
              <Input
                type="number"
                value={newServer.SIWE}
                onChange={(e) => setNewServer({ ...newServer, SIWE: e.target.value })}
                placeholder="1"
                disabled={isSubmittingServer}
              />
            </div>

            {/* Row 8: Details (Full Width) */}
            <div className="col-span-2 space-y-2">
              <Label className="text-xs font-bold text-muted-foreground uppercase">التفاصيل إضافية</Label>
              <Input
                value={newServer.SIDE}
                onChange={(e) => setNewServer({ ...newServer, SIDE: e.target.value })}
                placeholder="أي ملاحظات إضافية عن الخادم"
                disabled={isSubmittingServer}
              />
            </div>

            {/* Row 9: Additional Fields */}
            <div className="space-y-2">
              <Label className="text-xs font-bold text-muted-foreground uppercase">حقل إضافي 1</Label>
              <Input
                value={newServer.SIAF1}
                onChange={(e) => setNewServer({ ...newServer, SIAF1: e.target.value })}
                placeholder="مثال: نظام التشغيل"
                disabled={isSubmittingServer}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold text-muted-foreground uppercase">حقل إضافي 2</Label>
              <Input
                value={newServer.SIAF2}
                onChange={(e) => setNewServer({ ...newServer, SIAF2: e.target.value })}
                placeholder="مثال: الموقع الجغرافي"
                disabled={isSubmittingServer}
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button 
              variant="outline" 
              onClick={() => setIsAddModalOpen(false)} 
              className="px-6"
              disabled={isSubmittingServer}
            >
              إلغاء
            </Button>
            <Button 
              onClick={handleAddServer} 
              className="px-8 shadow-lg shadow-primary/20"
              disabled={isSubmittingServer}
            >
              {isSubmittingServer ? (
                <>
                  <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                  جاري الحفظ...
                </>
              ) : (
                'حفظ الخادم'
              )}
            </Button>
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
                <Label className="text-xs font-bold text-muted-foreground uppercase">نوع السيرفر (Run Mode)</Label>
                <Select value={selectedServer.runMode} onValueChange={(v) => setSelectedServer({ ...selectedServer, runMode: v })}>
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

      {/* Delete Server Confirmation Dialog */}
      <Dialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-destructive">تأكيد حذف الخادم</DialogTitle>
            <DialogDescription>
              هل أنت متأكد من رغبتك في حذف الخادم <span className="font-bold">{serverToDelete?.name}</span>؟
            </DialogDescription>
          </DialogHeader>
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 mb-4">
            <p className="text-sm text-destructive">
              ⚠️ تحذير: هذا الإجراء لا يمكن التراجع عنه. سيتم حذف جميع بيانات الخادم بشكل نهائي.
            </p>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button 
              variant="outline" 
              onClick={() => {
                setIsDeleteConfirmOpen(false);
                setServerToDelete(null);
              }} 
              className="px-6"
              disabled={deletingServerId !== null}
            >
              إلغاء
            </Button>
            <Button 
              variant="destructive"
              onClick={handleConfirmDelete} 
              className="px-8"
              disabled={deletingServerId !== null}
            >
              {deletingServerId !== null ? (
                <>
                  <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                  جاري الحذف...
                </>
              ) : (
                'حذف الخادم'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}