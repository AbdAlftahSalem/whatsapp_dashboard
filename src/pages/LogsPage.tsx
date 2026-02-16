import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText,
  Search,
  Download,
  Trash2,
  Filter,
  AlertCircle,
  CheckCircle,
  Info,
  AlertTriangle,
  Clock,
  RefreshCw,
  Database,
  Plus,
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  Calendar,
  User,
  Hash,
  Activity,
  Shield,
  SearchCode,
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';
import { getLogs, backupDatabase, LogEntry } from '@/lib/api';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

export default function LogsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [levelFilter, setLevelFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [isBackupModalOpen, setIsBackupModalOpen] = useState(false);
  const [backupProgress, setBackupProgress] = useState(0);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const { toast } = useToast();

  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ['logs', currentPage, pageSize, levelFilter],
    queryFn: () => getLogs(currentPage, pageSize, { level: levelFilter }),
    refetchInterval: 30000,
  });

  const logs = data?.data || [];
  const totalLogs = logs.length;
  const totalPages = Math.ceil(totalLogs / pageSize);

  const { filteredLogs, clientSearchTime } = useMemo(() => {
    const start = performance.now();
    
    const filtered = logs.filter((log) => {
      const searchLower = searchQuery.toLowerCase();
      const payloadString = log.SAPA ? JSON.stringify(log.SAPA).toLowerCase() : '';
      
      // Level Filter logic
      const matchesLevel = levelFilter === 'all' || 
        (log.SATY?.toUpperCase().includes(levelFilter.toUpperCase()) ?? false);

      if (!matchesLevel) return false;

      return (
        (log.SAMSG?.toLowerCase().includes(searchLower) ?? false) ||
        (log.CIORG?.toLowerCase().includes(searchLower) ?? false) ||
        (log.USER?.toLowerCase().includes(searchLower) ?? false) ||
        (log.SATOP?.toLowerCase().includes(searchLower) ?? false) ||
        (log.SAFN?.toLowerCase().includes(searchLower) ?? false) ||
        (log.SARO?.toLowerCase().includes(searchLower) ?? false) ||
        payloadString.includes(searchLower)
      );
    }).sort((a, b) => b.SASEQ - a.SASEQ);

    const end = performance.now();
    return {
      filteredLogs: filtered,
      clientSearchTime: ((end - start) / 1000).toFixed(3)
    };
  }, [logs, searchQuery, levelFilter]);

  const apiSearchTime = (() => {
    const raw = (data as any)?.searchTime ?? (data as any)?.elapsed ?? (data as any)?.took ?? (data as any)?.time ?? null;
    if (raw == null) return null;
    if (typeof raw === 'number') {
      // if server returns milliseconds (likely when value > 10), convert to seconds
      return (raw > 10 ? (raw / 1000) : raw).toFixed(3);
    }
    const n = Number(raw);
    if (!isNaN(n)) {
      return (n > 10 ? (n / 1000) : n).toFixed(3);
    }
    return String(raw);
  })();

  const displayedSearchTime = apiSearchTime ?? clientSearchTime;

  const pagedLogs = filteredLogs.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleBackup = async () => {
    setIsBackingUp(true);
    setBackupProgress(0);
    
    const interval = setInterval(() => {
      setBackupProgress(prev => {
        if (prev >= 90) {
          clearInterval(interval);
          return 90;
        }
        return prev + 10;
      });
    }, 300);

    try {
      const result = await backupDatabase();
      clearInterval(interval);
      setBackupProgress(100);
      
      setTimeout(() => {
        setIsBackingUp(false);
        setIsBackupModalOpen(false);
        toast({
          title: 'تم النسخ الاحتياطي',
          description: `تم حفظ الملف باسم: ${result.fileName}`,
        });
      }, 500);
    } catch (err) {
      clearInterval(interval);
      setIsBackingUp(false);
      toast({
        title: 'خطأ',
        description: 'فشل في إنشاء النسخة الاحتياطية',
        variant: 'destructive'
      });
    }
  };

  const getLevelIcon = (level: string) => {
    const type = level?.split('-')[1] || level;
    switch (type?.toUpperCase()) {
      case 'INFO': return <Info className="w-4 h-4 text-blue-500" />;
      case 'WARNING': return <AlertTriangle className="w-4 h-4 text-orange-500" />;
      case 'ERROR': return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'CRITICAL': return <Shield className="w-4 h-4 text-red-900" />;
      default: return <Info className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getLevelStyles = (level: string) => {
    const type = level?.split('-')[1] || level;
    switch (type?.toUpperCase()) {
      case 'INFO': return 'bg-blue-500/10 text-blue-600 border-blue-200';
      case 'WARNING': return 'bg-orange-500/10 text-orange-600 border-orange-200';
      case 'ERROR': return 'bg-red-500/10 text-red-600 border-red-200';
      case 'CRITICAL': return 'bg-red-900/10 text-red-900 border-red-900/20';
      default: return 'bg-muted text-muted-foreground border-border';
    }
  };

  const getLevelLabel = (level: string) => {
    const type = level?.split('-')[1] || level;
    switch (type?.toUpperCase()) {
      case 'INFO': return 'معلومة';
      case 'WARNING': return 'تحذير';
      case 'ERROR': return 'خطأ';
      default: return level || 'غير معروف';
    }
  };

  const getImportanceBadge = (priority: number) => {
    let color = 'bg-slate-100 text-slate-600';
    if (priority <= 2) color = 'bg-red-100 text-red-600';
    else if (priority <= 5) color = 'bg-orange-100 text-orange-600';
    
    return (
      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${color}`}>
        {priority}
      </span>
    );
  };

  return (
    <div className="space-y-8 max-w-[1600px] mx-auto">
      {/* Premium Header */}
      <div className="relative space-y-4">
        <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-muted-foreground/60 font-bold">
          <span>الرئيسية</span>
          <ChevronLeft className="w-3 h-3" />
          <span className="text-primary">سجلات النظام</span>
        </div>
        
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-1">
            <h1 className="text-3xl lg:text-4xl font-black text-foreground tracking-tight flex items-center gap-4">
              إدارة السجلات
            </h1>
            <p className="text-sm text-muted-foreground font-medium max-w-2xl px-1">
              نظام شامل لعرض وإدارة سجلات النظام مع إمكانية الأرشفة والنسخ الاحتياطي
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <Button 
              variant="outline" 
              onClick={() => setIsBackupModalOpen(true)}
              className="h-11 px-5 rounded-xl border-border/60 bg-background/50 hover:bg-muted/50 transition-all font-bold text-xs uppercase tracking-wider"
            >
              <Database className="w-4 h-4 ml-2 text-primary" />
              Database Backup
            </Button>
            <Button 
              disabled 
              className="h-11 px-6 rounded-xl shadow-xl shadow-primary/20 opacity-50 cursor-not-allowed font-bold text-xs uppercase tracking-wider"
            >
              <Plus className="w-4 h-4 ml-2" />
              إضافة تنبيه جديد
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="premium-card p-4 bg-primary/[0.02] border-primary/10">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">إجمالي السجلات</p>
              <h4 className="text-2xl font-black">{totalLogs}</h4>
            </div>
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <FileText className="w-5 h-5" />
            </div>
          </div>
        </div>
        <div className="premium-card p-4 bg-red-500/[0.02] border-red-500/10">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">أخطاء اليوم</p>
              <h4 className="text-2xl font-black text-red-600">
                {logs.filter(l => l.SATY?.includes('ERROR')).length}
              </h4>
            </div>
            <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center text-red-600">
              <AlertCircle className="w-5 h-5" />
            </div>
          </div>
        </div>
        <div className="premium-card p-4 bg-orange-500/[0.02] border-orange-500/10">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">تحذيرات نشطة</p>
              <h4 className="text-2xl font-black text-orange-600">
                {logs.filter(l => l.SATY?.includes('WARNING')).length}
              </h4>
            </div>
            <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-600">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
        </div>
        <div className="premium-card p-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">سرعة البحث</p>
              <h4 className="text-2xl font-black text-foreground">{displayedSearchTime}s</h4>
            </div>
            <button
              onClick={() => refetch()}
              title="تحديث السجلات"
              disabled={isFetching}
              className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center text-muted-foreground hover:bg-muted/70 transition-colors disabled:opacity-60"
            >
              <RefreshCw className={`w-5 h-5 ${isFetching ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="glass-panel p-2 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4 sticky top-4 z-40 shadow-xl shadow-black/5 ring-1 ring-black/5">
        <div className="relative w-full md:w-96">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
          <Input
            placeholder="البحث في الرسائل، المستخدم، الجلسة، المسار..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pr-10 h-11 border-none bg-transparent focus-visible:ring-0 text-sm font-medium"
          />
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto px-4">
          <Select value={levelFilter} onValueChange={setLevelFilter}>
            <SelectTrigger className="h-9 w-40 bg-muted/50 border-none text-xs font-bold">
              <Filter className="w-3.5 h-3.5 ml-2" />
              <SelectValue placeholder="نوع التنبيه" />
            </SelectTrigger>
            <SelectContent dir="rtl">
              <SelectItem value="all">جميع المستويات</SelectItem>
              <SelectItem value="INFO">معلومات</SelectItem>
              <SelectItem value="WARNING">تحذيرات</SelectItem>
              <SelectItem value="ERROR">أخطاء</SelectItem>
            </SelectContent>
          </Select>

          <div className="h-6 w-[1px] bg-border/40 mx-2 hidden md:block" />

          <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-widest px-3 py-1.5 rounded-lg bg-muted/50 border border-border/50">
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>النتائج: {filteredLogs.length}</span>
          </div>
        </div>
      </div>

      {/* Logs Table Area */}
      <div className="premium-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="bg-muted/40 border-b border-border/60">
                <th className="px-5 py-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3 h-3" />
                    الوقت (Timestamp)
                  </div>
                </th>
                <th className="px-5 py-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest">النوع (Type)</th>
                <th className="px-5 py-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest">TOPIC</th>
                <th className="px-5 py-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest">الرسالة</th>
                <th className="px-5 py-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest">المستخدم / الجلسة</th>
                <th className="px-5 py-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest">الأهمية</th>
                <th className="px-5 py-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest">IP Address</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              <AnimatePresence mode="popLayout">
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td colSpan={7} className="px-5 py-8">
                        <div className="h-4 bg-muted rounded w-full" />
                      </td>
                    </tr>
                  ))
                ) : pagedLogs.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-20 text-center">
                      <div className="flex flex-col items-center justify-center space-y-3 opacity-50">
                        <SearchCode className="w-12 h-12 text-muted-foreground" />
                        <p className="text-sm font-medium">لا توجد سجلات مطابقة للبحث</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  pagedLogs.map((log, index) => (
                    <motion.tr
                      key={log.SASEQ}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.03 }}
                      className="hover:bg-muted/20 transition-colors group"
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground/80" dir="ltr">
                          <Clock className="w-3 h-3" />
                          {log.DATEI ? format(new Date(log.DATEI), 'yyyy-MM-dd HH:mm:ss') : 'N/A'}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-lg border text-[10px] font-black uppercase tracking-tighter ${getLevelStyles(log.SATY)}`}>
                          {getLevelIcon(log.SATY)}
                          {getLevelLabel(log.SATY)}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-[10px] font-black uppercase tracking-widest text-primary bg-primary/5 px-2 py-1 rounded border border-primary/10">
                          {log.SATOP}
                        </span>
                      </td>
                      <td className="px-5 py-4 max-w-xs">
                        <p className="text-xs text-foreground font-medium leading-relaxed truncate group-hover:whitespace-normal transition-all" title={log.SAMSG}>
                          {log.SAMSG}
                        </p>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex flex-col gap-1.5">
                          <div className="flex items-center gap-2">
                             <User className="w-3 h-3 text-primary" />
                             <span className="text-xs font-bold text-foreground">{log.USER || 'System'}</span>
                             {log.CIORG && <span className="text-[9px] px-1.5 py-0.5 rounded bg-muted font-black uppercase">{log.CIORG}</span>}
                          </div>
                          <div className="flex flex-col text-[10px] text-muted-foreground font-mono leading-tight">
                            <span className="text-primary/70">{log.SARO}</span>
                            <span className="text-muted-foreground/50">{log.SAFN}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        {getImportanceBadge(log.SAPR)}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex flex-col gap-0.5 font-mono text-[10px]">
                           <span className="text-foreground font-bold">{log.SAPA?.client_ip || 'Internal'}</span>
                           {log.SAPA?.server_ip && <span className="text-muted-foreground/50">Host: {log.SAPA.server_ip}</span>}
                        </div>
                      </td>
                    </motion.tr>
                  ))
                )}
              </AnimatePresence>
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="p-5 border-t border-border/50 bg-muted/10 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">عرض</span>
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
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest hidden sm:inline">
              إظهار {(currentPage - 1) * pageSize + 1} إلى {Math.min(currentPage * pageSize, totalLogs)} من {totalLogs} سجل
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="h-9 px-3 bg-card border-border/60 hover:bg-muted/50 font-bold text-[10px] uppercase tracking-widest"
            >
              <ChevronRight className="w-4 h-4 ml-1" />
              السابق
            </Button>
            
            <div className="flex items-center gap-1 px-4 text-xs font-black">
              <span>{currentPage}</span>
              <span className="text-muted-foreground/40 mx-1">/</span>
              <span>{totalPages}</span>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages || totalPages === 0}
              className="h-9 px-3 bg-card border-border/60 hover:bg-muted/50 font-bold text-[10px] uppercase tracking-widest"
            >
              التالي
              <ChevronLeft className="w-4 h-4 mr-1" />
            </Button>
          </div>
        </div>
      </div>

      {/* Database Backup Modal */}
      <Dialog open={isBackupModalOpen} onOpenChange={(open) => !isBackingUp && setIsBackupModalOpen(open)}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">إنشاء نسخة احتياطية</DialogTitle>
            <DialogDescription>
              سيتم إنشاء نسخة احتياطية كاملة من قاعدة البيانات وضغطها للحفظ.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-6 space-y-6">
            <div className="p-4 rounded-xl bg-primary/5 border border-primary/10 flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Database className="w-5 h-5 text-primary" />
              </div>
              <div className="space-y-1">
                <p className="text-xs font-bold text-foreground">النسخ الاحتياطي للنظام</p>
                <p className="text-[10px] text-muted-foreground leading-relaxed">
                  تتضمن هذه العملية كافة الجداول، السجلات، وإعدادات النظام. سيتم ضغط الملف (ZIP) لتوفير المساحة.
                </p>
              </div>
            </div>

            {isBackingUp && (
              <div className="space-y-3">
                <div className="flex justify-between items-center px-1">
                  <span className="text-[10px] font-black text-primary uppercase tracking-widest animate-pulse">
                    جاري المعالجة...
                  </span>
                  <span className="text-xs font-black font-mono">{backupProgress}%</span>
                </div>
                <Progress value={backupProgress} className="h-2" />
                <p className="text-[9px] text-center text-muted-foreground italic">
                  يرجى عدم إغلاق النافذة حتى اكتمال العملية
                </p>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button 
              variant="outline" 
              onClick={() => setIsBackupModalOpen(false)} 
              disabled={isBackingUp}
              className="px-6 rounded-xl"
            >
              إلغاء
            </Button>
            <Button 
              onClick={handleBackup} 
              disabled={isBackingUp}
              className="px-8 rounded-xl shadow-lg shadow-primary/20"
            >
              {isBackingUp ? (
                <>
                  <RefreshCw className="w-4 h-4 ml-2 animate-spin" />
                  جاري النسخ...
                </>
              ) : (
                'ابدأ النسخ الاحتياطي'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
