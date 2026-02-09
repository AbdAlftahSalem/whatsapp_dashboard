import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Server,
  Plus,
  Search,
  MoreHorizontal,
  RefreshCw,
  Trash2,
  Edit2,
  Cpu,
  HardDrive,
  Activity,
  CheckCircle,
  XCircle,
  Loader2,
  AlertTriangle,
  LayoutGrid,
  List,
  ChevronLeft,
  ChevronRight,
  Monitor,
  Database,
  Globe,
  Settings,
  X,
  PlusCircle,
  ShieldAlert
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
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
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { getServers, addServer, updateServer, deleteServer } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import { format, parseISO } from 'date-fns';
import { ar } from 'date-fns/locale';

interface ServerData {
  SISEQ: number;
  SISN: string;
  SITY: string;
  SIIP: string;
  SIPO: number;
  SIPT: string;
  SIST: number;
  DEFN: number;
  SIRM: string;
  SIRRW: number;
  SIRT: string;
  SIRP: string;
  SIMS: number;
  SIDE: string;
  GUID: string;
  // Mocked for monitoring
  cpuUsage: number;
  ramUsage: number;
  ramTotal: number;
  diskUsage: number;
  uptime: string;
  activeSessions: number;
  os: string;
  lastCheck: string;
}

export default function ServersPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedServer, setSelectedServer] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const { token } = useAuthStore();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [newServerForm, setNewServerForm] = useState({
    SISN: '',
    SIIP: '',
    SIPO: 8080,
    SITY: 'NORMAL',
    SIMS: 100,
    SIDE: ''
  });

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['servers'],
    queryFn: getServers,
    refetchInterval: 30000, // Auto refresh every 30 seconds
  });

  // Effect for more frequent updates simulation if needed, but 30s is standard
  useEffect(() => {
    const timer = setInterval(() => {
        // refetch(); // In real app, this would update metrics
    }, 15000);
    return () => clearInterval(timer);
  }, [refetch]);

  const serversRaw = data?.data?.servers || [];

  // Transform with mock monitoring data as API doesn't fully provide these yet
  const servers: ServerData[] = useMemo(() => {
    return serversRaw.map((s: any, idx: number) => ({
      ...s,
      cpuUsage: Math.floor(Math.random() * (idx % 3 === 0 ? 40 : 95)),
      ramUsage: Number((Math.random() * 12 + 2).toFixed(1)),
      ramTotal: 16,
      diskUsage: Math.floor(Math.random() * 40 + 30),
      uptime: `${Math.floor(Math.random() * 60 + 1)} يوم`,
      activeSessions: Math.floor(Math.random() * (s.SIMS || 100)),
      os: idx % 2 === 0 ? 'Linux (Ubuntu 22.04)' : 'Windows Server 2022',
      lastCheck: new Date().toISOString()
    }));
  }, [serversRaw]);

  const filteredServers = useMemo(() => {
    return servers.filter(
      (server) =>
        (server.SISN || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (server.SIIP || '').includes(searchQuery) ||
        (server.SITY || '').toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [servers, searchQuery]);

  const totalPages = Math.ceil(filteredServers.length / pageSize);
  const paginatedServers = filteredServers.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const addMutation = useMutation({
    mutationFn: (data: any) => addServer(data, token!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['servers'] });
      toast({ title: 'تمت إضافة الخادم بنجاح' });
      setIsAddModalOpen(false);
      setNewServerForm({ SISN: '', SIIP: '', SIPO: 8080, SITY: 'NORMAL', SIMS: 100, SIDE: '' });
    },
    onError: (err: any) => toast({ title: 'فشل إضافة الخادم', description: err.message, variant: 'destructive' })
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number, data: any }) => updateServer(id, data, token!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['servers'] });
      toast({ title: 'تم تحديث بيانات الخادم' });
      setIsEditModalOpen(false);
    },
    onError: (err: any) => toast({ title: 'فشل التحديث', description: err.message, variant: 'destructive' })
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteServer(id, token!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['servers'] });
      toast({ title: 'تم حذف الخادم بنجاح' });
      setIsDeleteModalOpen(false);
    },
    onError: (err: any) => toast({ title: 'فشل الحذف', description: err.message, variant: 'destructive' })
  });

  const getStatusColor = (status: number) => {
    return status === 1 ? 'bg-success/10 text-success border-success/20' : 'bg-destructive/10 text-destructive border-destructive/20';
  };

  const getMetricColor = (usage: number, limit: number) => {
    const percent = usage;
    if (percent >= limit) return 'text-destructive';
    if (percent >= limit - 15) return 'text-warning';
    return 'text-success';
  };

  const getProgressColor = (usage: number, limit: number) => {
    if (usage >= limit) return 'bg-destructive';
    if (usage >= limit - 15) return 'bg-warning';
    return 'bg-success';
  };

  const handleRestartAll = () => {
    toast({ title: 'إعادة تشغيل جميع الخوادم هي ميزة مؤجلة' });
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
        <p className="text-muted-foreground animate-pulse font-medium">جاري جلب بيانات الخوادم...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-10">
      {/* Header Section */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between bg-card p-6 rounded-2xl border border-border shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20 shrink-0">
            <Monitor className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">مراقبة الخوادم</h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
                تحديث مباشر
              </span>
              <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded border border-border">
                {isFetching ? 'جاري التحديث...' : `آخر تحديث: ${new Date().toLocaleTimeString('ar-SA')}`}
              </span>
            </div>
          </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleRestartAll} className="gap-2 border-orange-200 text-orange-600 hover:bg-orange-50">
                <RefreshCw className="w-3.5 h-3.5" />
                إعادة تشغيل الكل
            </Button>
            <Button size="sm" onClick={() => setIsAddModalOpen(true)} className="gap-2 shadow-sm">
                <PlusCircle className="w-3.5 h-3.5" />
                إضافة خادم جديد
            </Button>
        </div>
      </div>

      {/* Search & Layout Toggle */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative w-full max-w-md">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="بحث عن خادم (الاسم، IP، النوع)..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pr-10 bg-card border-border/60 focus:ring-primary/20"
          />
        </div>
        
        <div className="flex items-center gap-3">
            <div className="bg-card border border-border rounded-lg p-1 flex items-center shadow-sm">
                <button 
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 rounded-md transition-all ${viewMode === 'grid' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:bg-muted'}`}
                >
                    <LayoutGrid className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => setViewMode('list')}
                  className={`p-1.5 rounded-md transition-all ${viewMode === 'list' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:bg-muted'}`}
                >
                    <List className="w-4 h-4" />
                </button>
            </div>
            
            <Select value={pageSize.toString()} onValueChange={(v) => { setPageSize(parseInt(v)); setCurrentPage(1); }}>
                <SelectTrigger className="w-[100px] h-9 bg-card">
                  <SelectValue placeholder="العدد" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="20">20 خادم</SelectItem>
                  <SelectItem value="30">30 خادم</SelectItem>
                  <SelectItem value="50">50 خادم</SelectItem>
                </SelectContent>
            </Select>
        </div>
      </div>

      {/* Main Content Area */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          <AnimatePresence mode="popLayout">
            {paginatedServers.map((server) => (
              <motion.div
                layout
                key={server.SISEQ}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="stats-card p-0 overflow-hidden group hover:border-primary/30 transition-all duration-300"
              >
                {/* Card Top Branding */}
                <div className={`h-1.5 w-full ${server.SIST === 1 ? 'bg-success' : 'bg-destructive'}`} />
                
                <div className="p-5">
                    <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center border transition-colors ${server.SIST === 1 ? 'bg-success/10 border-success/20 text-success' : 'bg-destructive/10 border-destructive/20 text-destructive'}`}>
                                <Server className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="font-bold text-foreground group-hover:text-primary transition-colors">{server.SISN}</h3>
                                <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-mono mt-0.5">
                                    <Globe className="w-3 h-3" />
                                    <span>{server.SIIP}:{server.SIPO}</span>
                                </div>
                            </div>
                        </div>
                        
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                                    <MoreHorizontal className="w-4 h-4 transition-transform group-hover:rotate-90" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-40" dir="rtl">
                                <DropdownMenuItem className="gap-2" onClick={() => { setSelectedServer(server); setIsEditModalOpen(true); }}>
                                    <Edit2 className="w-4 h-4 ml-2" />
                                    تعديل
                                </DropdownMenuItem>
                                <DropdownMenuItem className="gap-2" onClick={() => toast({ title: 'إعادة تشغيل الخادم هي ميزة مؤجلة' })}>
                                    <RefreshCw className="w-4 h-4 ml-2" />
                                    إعادة تشغيل
                                </DropdownMenuItem>
                                <DropdownMenuItem className="gap-2 text-destructive" onClick={() => { setSelectedServer(server); setIsDeleteModalOpen(true); }}>
                                    <Trash2 className="w-4 h-4 ml-2" />
                                    حذف
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>

                    {/* Status & Type Bar */}
                    <div className="flex items-center justify-between gap-2 mb-6">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getStatusColor(server.SIST)}`}>
                            {server.SIST === 1 ? 'ONLINE' : 'OFFLINE'}
                        </span>
                        <span className="bg-muted text-muted-foreground px-2 py-0.5 rounded-full text-[10px] font-mono border">
                            {server.SITY}
                        </span>
                        <div className="flex items-center gap-1 text-[10px] text-muted-foreground mr-auto bg-muted/50 px-2 py-0.5 rounded border border-border/40">
                            <Activity className="w-3 h-3" />
                            <span>{server.activeSessions}/{server.SIMS} جلسة</span>
                        </div>
                    </div>

                    {/* Resource Gauges */}
                    <div className="space-y-4 mb-6">
                        {/* CPU */}
                        <div className="space-y-1.5">
                            <div className="flex items-center justify-between text-[11px]">
                                <div className="flex items-center gap-2">
                                    <Cpu className="w-3.5 h-3.5 text-muted-foreground" />
                                    <span className="font-medium">المعالج (CPU)</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    {server.cpuUsage >= 80 && <ShieldAlert className="w-3 h-3 text-destructive animate-bounce" />}
                                    <span className={`font-bold ${getMetricColor(server.cpuUsage, 80)}`}>{server.cpuUsage}%</span>
                                </div>
                            </div>
                            <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden border border-border/20">
                                <motion.div 
                                  initial={{ width: 0 }}
                                  animate={{ width: `${server.cpuUsage}%` }}
                                  className={`h-full ${getProgressColor(server.cpuUsage, 80)}`}
                                />
                            </div>
                        </div>

                        {/* RAM */}
                        <div className="space-y-1.5">
                            <div className="flex items-center justify-between text-[11px]">
                                <div className="flex items-center gap-2">
                                    <HardDrive className="w-3.5 h-3.5 text-muted-foreground" />
                                    <span className="font-medium">الذاكرة (RAM)</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    { (server.ramUsage / server.ramTotal * 100) >= 85 && <ShieldAlert className="w-3 h-3 text-destructive animate-bounce" />}
                                    <span className={`font-bold ${getMetricColor(server.ramUsage / server.ramTotal * 100, 85)}`}>
                                        {server.ramUsage}GB / {server.ramTotal}GB
                                    </span>
                                </div>
                            </div>
                            <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden border border-border/20">
                                <motion.div 
                                  initial={{ width: 0 }}
                                  animate={{ width: `${(server.ramUsage / server.ramTotal) * 100}%` }}
                                  className={`h-full ${getProgressColor(server.ramUsage / server.ramTotal * 100, 85)}`}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Additional Details */}
                    <div className="grid grid-cols-2 gap-2 pt-4 border-t border-border/60">
                        <div className="flex flex-col gap-0.5">
                            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">نظام التشغيل</span>
                            <span className="text-xs font-medium truncate" title={server.os}>{server.os}</span>
                        </div>
                        <div className="flex flex-col gap-0.5 text-left">
                            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">وقت التشغيل</span>
                            <span className="text-xs font-medium">{server.uptime}</span>
                        </div>
                    </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      ) : (
        /* List View Mode */
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden"
        >
          <div className="overflow-x-auto">
            <table className="w-full text-right">
                <thead className="bg-muted/50 border-b border-border">
                    <tr className="text-[11px] text-muted-foreground font-bold uppercase tracking-widest">
                        <th className="px-6 py-4">الخادم</th>
                        <th className="px-6 py-4">العنوان</th>
                        <th className="px-6 py-4">الحالة</th>
                        <th className="px-6 py-4">الجلسات</th>
                        <th className="px-6 py-4">CPU</th>
                        <th className="px-6 py-4">RAM</th>
                        <th className="px-6 py-4">آخر فحص</th>
                        <th className="px-6 py-4 text-center">الإجراءات</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-border">
                    {paginatedServers.map((server) => (
                        <tr key={server.SISEQ} className="hover:bg-muted/30 transition-colors">
                            <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-lg border ${server.SIST === 1 ? 'bg-success/10 border-success/20 text-success' : 'bg-destructive/10 border-destructive/20 text-destructive'}`}>
                                        <Server className="w-4 h-4" />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-sm font-bold">{server.SISN}</span>
                                        <span className="text-[10px] text-muted-foreground font-mono">{(server.GUID || '').substring(0, 8)}...</span>
                                    </div>
                                </div>
                            </td>
                            <td className="px-6 py-4">
                                <span className="text-xs font-mono text-muted-foreground" dir="ltr">{server.SIIP}:{server.SIPO}</span>
                            </td>
                            <td className="px-6 py-4">
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getStatusColor(server.SIST)}`}>
                                    {server.SIST === 1 ? 'ONLINE' : 'OFFLINE'}
                                </span>
                            </td>
                            <td className="px-6 py-4">
                                <div className="flex flex-col gap-1">
                                    <span className="text-xs font-medium">{server.activeSessions} / {server.SIMS}</span>
                                    <Progress value={(server.activeSessions / server.SIMS) * 100} className="h-1 w-20" />
                                </div>
                            </td>
                            <td className="px-6 py-4">
                                <div className="flex items-center gap-2">
                                    <span className={`text-xs font-bold ${getMetricColor(server.cpuUsage, 80)}`}>{server.cpuUsage}%</span>
                                    <div className="w-12 h-1 bg-muted rounded-full">
                                        <div className={`h-full rounded-full ${getProgressColor(server.cpuUsage, 80)}`} style={{width: `${server.cpuUsage}%`}} />
                                    </div>
                                </div>
                            </td>
                            <td className="px-6 py-4">
                                <span className="text-xs font-medium">{server.ramUsage}GB</span>
                            </td>
                            <td className="px-6 py-4">
                                <span className="text-[10px] text-muted-foreground">
                                    {format(parseISO(server.lastCheck), 'HH:mm:ss')}
                                </span>
                            </td>
                            <td className="px-6 py-4">
                                <div className="flex items-center justify-center gap-2">
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" onClick={() => { setSelectedServer(server); setIsEditModalOpen(true); }}>
                                        <Edit2 className="w-3.5 h-3.5" />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => { setSelectedServer(server); setIsDeleteModalOpen(true); }}>
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </Button>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {/* Pagination Footer */}
      <div className="flex items-center justify-between bg-card p-4 rounded-xl border border-border shadow-sm">
        <div className="flex items-center gap-4">
          <p className="text-xs text-muted-foreground">
            عرض {paginatedServers.length} من أصل {filteredServers.length} خادم
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(prev => prev - 1)}
            className="h-8"
          >
            <ChevronRight className="w-4 h-4 ml-1" />
            السابق
          </Button>

          <div className="flex items-center px-4 py-1 bg-muted rounded-md text-[10px] font-bold">
            صفحة {currentPage} من {totalPages || 1}
          </div>

          <Button
            variant="outline"
            size="sm"
            disabled={currentPage === totalPages || totalPages === 0}
            onClick={() => setCurrentPage(prev => prev + 1)}
            className="h-8"
          >
            التالي
            <ChevronLeft className="w-4 h-4 mr-1" />
          </Button>
        </div>
      </div>

      {/* Modals Implementation */}
      <AnimatePresence>
        {/* Add Server Modal */}
        <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
            <DialogContent className="max-w-md" dir="rtl">
                <DialogHeader className="text-right">
                    <DialogTitle className="flex items-center gap-2">
                        <PlusCircle className="w-5 h-5 text-primary" />
                        إضافة خادم نظام جديد
                    </DialogTitle>
                    <DialogDescription>
                        يرجى إكمال كافة الحقول الإجبارية لضمان تفعيل ميزات المراقبة.
                    </DialogDescription>
                </DialogHeader>
                
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>اسم الخادم <span className="text-destructive">*</span></Label>
                            <Input 
                              placeholder="مثال: خادم الرياض الرئيسي" 
                              value={newServerForm.SISN}
                              onChange={(e) => setNewServerForm({...newServerForm, SISN: e.target.value})}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>نوع الخادم</Label>
                            <Select value={newServerForm.SITY} onValueChange={(v) => setNewServerForm({...newServerForm, SITY: v})}>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="NORMAL">NORMAL</SelectItem>
                                  <SelectItem value="CONTROL">CONTROL</SelectItem>
                                  <SelectItem value="M-B">MAIN-BACKUP</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                        <div className="col-span-2 space-y-2">
                            <Label>عنوان IP <span className="text-destructive">*</span></Label>
                            <Input 
                              placeholder="127.0.0.1" 
                              dir="ltr" 
                              value={newServerForm.SIIP}
                              onChange={(e) => setNewServerForm({...newServerForm, SIIP: e.target.value})}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>المنفذ (Port)</Label>
                            <Input 
                              type="number" 
                              value={newServerForm.SIPO}
                              onChange={(e) => setNewServerForm({...newServerForm, SIPO: parseInt(e.target.value)})}
                              dir="ltr"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>أقصى عدد جلسات (Max Sessions)</Label>
                        <Input 
                          type="number" 
                          value={newServerForm.SIMS}
                          onChange={(e) => setNewServerForm({...newServerForm, SIMS: parseInt(e.target.value)})}
                          dir="ltr"
                        />
                    </div>
                    
                    <div className="space-y-2">
                        <Label>ملاحظات إضافية</Label>
                        <textarea 
                          className="w-full min-h-[80px] p-3 rounded-md border border-input bg-card text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                          placeholder="وصف إضافي للخادم أو موقعه..."
                          value={newServerForm.SIDE}
                          onChange={(e) => setNewServerForm({...newServerForm, SIDE: e.target.value})}
                        />
                    </div>
                </div>

                <DialogFooter className="gap-2 sm:gap-0">
                    <Button variant="outline" onClick={() => setIsAddModalOpen(false)}>إلغاء</Button>
                    <Button onClick={() => addMutation.mutate(newServerForm)} disabled={addMutation.isPending}>
                        {addMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'حفظ الخادم'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>

        {/* Edit Server Modal */}
        <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
            <DialogContent className="max-w-md" dir="rtl">
                <DialogHeader className="text-right">
                    <DialogTitle className="flex items-center gap-2">
                        <Edit2 className="w-5 h-5 text-primary" />
                        تعديل بيانات الخادم
                    </DialogTitle>
                </DialogHeader>
                
                {selectedServer && (
                    <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                            <Label>اسم الخادم</Label>
                            <Input 
                                value={selectedServer.SISN} 
                                onChange={(e) => setSelectedServer({...selectedServer, SISN: e.target.value})}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>IP العنوان</Label>
                                <Input value={selectedServer.SIIP} dir="ltr" />
                            </div>
                            <div className="space-y-2">
                                <Label>عدد الجلسات القصوى</Label>
                                <Input 
                                  type="number" 
                                  value={selectedServer.SIMS} 
                                  onChange={(e) => setSelectedServer({...selectedServer, SIMS: parseInt(e.target.value)})}
                                />
                            </div>
                        </div>
                    </div>
                )}

                <DialogFooter className="gap-2 sm:gap-0">
                    <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>إلغاء</Button>
                    <Button onClick={() => updateMutation.mutate({ id: selectedServer.SISEQ, data: selectedServer })} disabled={updateMutation.isPending}>
                        {updateMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'تحديث البيانات'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>

        {/* Delete Confirmation Modal */}
        <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
            <DialogContent className="max-w-sm" dir="rtl">
                <DialogHeader className="text-right">
                    <DialogTitle className="text-destructive flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5" />
                        تأكيد حذف الخادم
                    </DialogTitle>
                    <DialogDescription className="pt-2">
                        هل أنت متأكد من رغبتك في حذف الخادم <span className="font-bold text-foreground">"{selectedServer?.SISN}"</span>؟
                        <br /><br />
                        <span className="text-destructive font-medium border-b border-destructive/20 pb-1">تحذير:</span> لا يمكن التراجع عن هذه العملية وسيتم فصل كافة الجلسات المرتبطة به.
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter className="mt-4 gap-2">
                    <Button variant="outline" className="flex-1" onClick={() => setIsDeleteModalOpen(false)}>إلغاء</Button>
                    <Button variant="destructive" className="flex-1" onClick={() => deleteMutation.mutate(selectedServer.SISEQ)} disabled={deleteMutation.isPending}>
                        {deleteMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'تأكيد الحذف'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
      </AnimatePresence>
    </div>
  );
}

// Custom Select components for consistent styling with original theme
function Select({ children, value, onValueChange }: { children: React.ReactNode, value: string, onValueChange: (v: string) => void }) {
    return (
        <div className="relative inline-block w-full">
            <select 
              value={value} 
              onChange={(e) => onValueChange(e.target.value)}
              className="w-full h-10 px-3 py-2 text-sm bg-card border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary appearance-none pr-8"
              dir="rtl"
            >
                {children}
            </select>
            <div className="absolute inset-y-0 left-2 flex items-center pointer-events-none text-muted-foreground">
                <ChevronDown className="w-4 h-4" />
            </div>
        </div>
    );
}

function SelectTrigger({ children, className }: { children: React.ReactNode, className?: string }) {
    return <div className={className}>{children}</div>;
}

function SelectValue({ placeholder }: { placeholder?: string }) {
    return <span className="truncate">{placeholder}</span>;
}

function SelectContent({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}

function SelectItem({ children, value }: { children: React.ReactNode, value: string }) {
    return <option value={value}>{children}</option>;
}

function ChevronDown(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="m6 9 6 6 6-6" />
        </svg>
    );
}
