import { useState, useMemo } from 'react';
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
  History,
  Archive,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  Terminal,
  User,
  Globe,
  PlusCircle,
  ArrowUpDown,
  Calendar,
  MoreVertical,
  Loader2
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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getLogs, createBackup, getBackups } from '@/lib/api';
import { format, parseISO, isWithinInterval, startOfDay, endOfDay } from 'date-fns';
import { ar } from 'date-fns/locale';

export default function LogsPage() {
  const [activeTab, setActiveTab] = useState('all-logs');
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  
  const [isBackupModalOpen, setIsBackupModalOpen] = useState(false);
  const [isAddAlertModalOpen, setIsAddAlertModalOpen] = useState(false);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Queries
  const { data: logsData, isLoading: isLoadingLogs, refetch: refetchLogs } = useQuery({
    queryKey: ['logs'],
    queryFn: getLogs,
    refetchInterval: 60000,
  });

  const { data: backupsData, isLoading: isLoadingBackups } = useQuery({
    queryKey: ['backups'],
    queryFn: getBackups,
  });

  // Mutations
  const backupMutation = useMutation({
    mutationFn: createBackup,
    onSuccess: () => {
      toast({ title: 'بدأت عملية النسخ الاحتياطي', description: 'سيتم إخطارك عند اكتمال العملية.' });
      setIsBackupModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ['backups'] });
    },
    onError: (err: any) => {
      toast({ title: 'فشل النسخ الاحتياطي', description: err.message, variant: 'destructive' });
    }
  });

  const logsRaw = logsData?.data?.Logs || [];
  const backups = backupsData?.data?.backups || [];

  const filteredLogs = useMemo(() => {
    return logsRaw.filter((log) => {
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch = 
        !searchQuery || 
        log.SAMESS.toLowerCase().includes(searchLower) ||
        log.SAFN.toLowerCase().includes(searchLower) ||
        log.SARO.toLowerCase().includes(searchLower) ||
        log.CIORG.toLowerCase().includes(searchLower) ||
        log.SATOPI.toLowerCase().includes(searchLower);

      const matchesType = typeFilter === 'all' || log.SATYP.toLowerCase() === typeFilter.toLowerCase();
      
      // Date filter logic (simplified for now)
      let matchesDate = true;
      if (dateFilter !== 'all') {
        const logDate = parseISO(log.SADAT);
        const today = new Date();
        if (dateFilter === 'today') {
           matchesDate = isWithinInterval(logDate, { start: startOfDay(today), end: endOfDay(today) });
        }
      }

      return matchesSearch && matchesType && matchesDate;
    }).sort((a, b) => b.SASEQ - a.SASEQ); // Descending by SASEQ
  }, [logsRaw, searchQuery, typeFilter, dateFilter]);

  const paginatedLogs = filteredLogs.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const totalPages = Math.ceil(filteredLogs.length / pageSize);

  const getTypeStyles = (type: string) => {
    const t = type.toLowerCase();
    if (t === 'error') return 'bg-destructive/10 text-destructive border-destructive/20';
    if (t === 'warning') return 'bg-orange-500/10 text-orange-600 border-orange-500/20';
    if (t === 'info' || t === 'information') return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
    if (t === 'critical') return 'bg-red-900/10 text-red-900 border-red-900/30 font-bold';
    return 'bg-muted text-muted-foreground border-border';
  };

  const getTypeIcon = (type: string) => {
    const t = type.toLowerCase();
    if (t === 'error') return <AlertCircle className="w-4 h-4" />;
    if (t === 'warning') return <AlertTriangle className="w-4 h-4" />;
    if (t === 'info' || t === 'information') return <Info className="w-4 h-4" />;
    if (t === 'critical') return <ShieldAlert className="w-4 h-4" />;
    return <Terminal className="w-4 h-4" />;
  };

  const getImportanceLabel = (imp: string) => {
    switch(imp?.toLowerCase()) {
      case 'high': return 'عالية';
      case 'medium': return 'متوسطة';
      case 'low': return 'منخفضة';
      case 'critical': return 'حرجة';
      default: return imp;
    }
  };

  if (isLoadingLogs) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
        <p className="text-muted-foreground animate-pulse font-medium">جاري تحميل السجلات...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-10">
      {/* Header Section */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between bg-card p-6 rounded-2xl border border-border shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20 shrink-0">
            <Archive className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">مركز مراقبة السجلات</h1>
            <p className="text-xs text-muted-foreground mt-1">تتبع وإدارة جميع أحداث النظام وتنبيهات الأمان</p>
          </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setIsBackupModalOpen(true)} className="gap-2 border-primary/20 hover:bg-primary/5">
                <Database className="w-3.5 h-3.5" />
                Database Backup
            </Button>
            <Button size="sm" onClick={() => setIsAddAlertModalOpen(true)} className="gap-2 shadow-sm">
                <PlusCircle className="w-3.5 h-3.5" />
                إضافة تنبيه جديد
            </Button>
        </div>
      </div>

      <Tabs defaultValue="all-logs" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-muted/50 p-1 rounded-xl mb-6">
          <TabsTrigger value="all-logs" className="rounded-lg gap-2">
            <List className="w-4 h-4" />
            سجلات النظام
            <Badge variant="secondary" className="mr-1 h-5 text-[10px]">{filteredLogs.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="backups" className="rounded-lg gap-2">
            <History className="w-4 h-4" />
            تاريخ النسخ الاحتياطي
            <Badge variant="secondary" className="mr-1 h-5 text-[10px]">{backups.length}</Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all-logs" className="space-y-6 mt-0">
          {/* Filters Bar */}
          <div className="bg-card border border-border rounded-xl p-4 shadow-sm flex flex-col md:flex-row items-center gap-4">
            <div className="relative flex-1 w-full max-w-md">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="بحث في الرسائل، المستخدم، الجلسة..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pr-10 bg-muted/30 border-none focus-visible:ring-primary/20"
              />
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto">
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-full md:w-[160px] bg-muted/30 border-none">
                  <div className="flex items-center gap-2">
                    <Filter className="w-3.5 h-3.5 text-muted-foreground" />
                    <SelectValue placeholder="نوع التنبيه" />
                  </div>
                </SelectTrigger>
                <SelectContent dir="rtl">
                  <SelectItem value="all">جميع الأنواع</SelectItem>
                  <SelectItem value="info">Info</SelectItem>
                  <SelectItem value="warning">Warning</SelectItem>
                  <SelectItem value="error">Error</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>

              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger className="w-full md:w-[160px] bg-muted/30 border-none">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                    <SelectValue placeholder="التاريخ" />
                  </div>
                </SelectTrigger>
                <SelectContent dir="rtl">
                  <SelectItem value="all">كل الأوقات</SelectItem>
                  <SelectItem value="today">اليوم</SelectItem>
                  <SelectItem value="yesterday">أمس</SelectItem>
                  <SelectItem value="week">آخر أسبوع</SelectItem>
                </SelectContent>
              </Select>

              <div className="h-8 w-[1px] bg-border mx-1 hidden md:block" />
              
              <Button variant="ghost" size="icon" onClick={() => refetchLogs()} className="h-9 w-9 rounded-lg hover:bg-primary/5">
                <RefreshCw className="w-4 h-4 text-muted-foreground" />
              </Button>
            </div>
          </div>

          {/* Table Area */}
          <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-right border-collapse">
                <thead className="bg-muted/50 border-b border-border">
                  <tr className="text-[11px] text-muted-foreground font-bold uppercase tracking-widest whitespace-nowrap">
                    <th className="px-6 py-4">التاريخ والوقت</th>
                    <th className="px-6 py-4">النوع</th>
                    <th className="px-6 py-4">TOPIC</th>
                    <th className="px-6 py-4">الرسالة</th>
                    <th className="px-6 py-4">المستخدم / الجلسة</th>
                    <th className="px-6 py-4">الأهمية</th>
                    <th className="px-6 py-4">IP Address</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  <AnimatePresence mode="popLayout">
                    {paginatedLogs.map((log) => (
                      <motion.tr
                        layout
                        key={log.SASEQ}
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="group hover:bg-primary/[0.02] transition-colors"
                      >
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="text-xs font-medium text-foreground">
                              {format(parseISO(log.SADAT), 'yyyy/MM/dd', { locale: ar })}
                            </span>
                            <span className="text-[10px] text-muted-foreground font-mono mt-0.5">
                              {format(parseISO(log.SADAT), 'HH:mm:ss')}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <Badge variant="outline" className={`gap-1.5 px-2 py-0.5 text-[10px] font-bold ${getTypeStyles(log.SATYP)}`}>
                            {getTypeIcon(log.SATYP)}
                            {log.SATYP.toUpperCase()}
                          </Badge>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-xs font-mono bg-muted/50 px-2 py-0.5 rounded border border-border/40">
                            {log.SATOPI}
                          </span>
                        </td>
                        <td className="px-6 py-4 max-w-xs">
                          <p className="text-xs text-foreground line-clamp-2 leading-relaxed" title={log.SAMESS}>
                            {log.SAMESS}
                          </p>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-1.5 text-xs">
                              <User className="w-3 h-3 text-primary/60" />
                              <span className="font-medium">{log.SAFN || 'System'}</span>
                            </div>
                            <span className="text-[10px] text-muted-foreground font-mono bg-muted px-1.5 py-0.5 rounded self-start">
                              {log.CIORG || 'N/A'}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            log.SAIMP?.toLowerCase() === 'high' || log.SAIMP?.toLowerCase() === 'critical' 
                              ? 'bg-red-50 text-red-600 border-red-200' 
                              : 'bg-muted text-muted-foreground border-border'
                          }`}>
                            {getImportanceLabel(log.SAIMP)}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {log.SAIP ? (
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-mono">
                              <Globe className="w-3 h-3" />
                              <span>{log.SAIP}</span>
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground/30">—</span>
                          )}
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
              
              {paginatedLogs.length === 0 && (
                <div className="flex flex-col items-center justify-center p-20 text-center text-muted-foreground">
                  <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                     <FileText className="w-8 h-8 opacity-20" />
                  </div>
                  <p className="text-sm">لا توجد سجلات مطابقة للبحث</p>
                </div>
              )}
            </div>
            
            {/* Pagination */}
            <div className="flex items-center justify-between p-4 border-t border-border bg-muted/10">
              <div className="flex items-center gap-4">
                <p className="text-xs text-muted-foreground">
                  عرض {paginatedLogs.length} من {filteredLogs.length} سجل
                </p>
                <div className="h-4 w-[1px] bg-border" />
                <Select value={pageSize.toString()} onValueChange={(v) => { setPageSize(parseInt(v)); setCurrentPage(1); }}>
                    <SelectTrigger className="h-7 w-[80px] bg-transparent border-none text-[10px] font-bold">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent dir="rtl">
                        <SelectItem value="20">20 / ص</SelectItem>
                        <SelectItem value="30">30 / ص</SelectItem>
                        <SelectItem value="50">50 / ص</SelectItem>
                    </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(prev => prev - 1)}
                  className="h-8 w-8 p-0"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
                <div className="h-8 px-3 flex items-center bg-card border border-border rounded-md text-[10px] font-bold shadow-sm">
                  {currentPage} / {totalPages || 1}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === totalPages || totalPages === 0}
                  onClick={() => setCurrentPage(prev => prev + 1)}
                  className="h-8 w-8 p-0"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="backups" className="mt-0">
          <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden min-h-[400px]">
            <div className="p-6 border-b border-border flex items-center justify-between bg-muted/20">
              <div>
                <h3 className="font-bold text-foreground">النسخ الاحتياطية المتوفرة</h3>
                <p className="text-xs text-muted-foreground mt-0.5">تحميل وإدارة نسخ قاعدة البيانات السابقة</p>
              </div>
              <Button onClick={() => setIsBackupModalOpen(true)} className="gap-2">
                <PlusCircle className="w-4 h-4" />
                إنشاء نسخة جديدة
              </Button>
            </div>

            <div className="divide-y divide-border">
              {isLoadingBackups ? (
                <div className="p-20 text-center">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" />
                </div>
              ) : backups.length === 0 ? (
                <div className="p-20 text-center flex flex-col items-center">
                   <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-4">
                     <Database className="w-10 h-10 opacity-10" />
                   </div>
                   <h4 className="font-bold text-foreground mb-1">لا توجد نسخ احتياطية</h4>
                   <p className="text-xs text-muted-foreground max-w-xs">يمكنك البدء بإنشاء أول نسخة احتياطية لقاعدة البيانات الخاصة بك الآن.</p>
                </div>
              ) : (
                backups.map((backup, idx) => (
                  <div key={idx} className="p-5 flex items-center justify-between hover:bg-muted/30 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-primary/5 flex items-center justify-center border border-primary/10">
                        <Archive className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-foreground" dir="ltr">{backup.filename}</p>
                        <div className="flex items-center gap-3 mt-1 text-[10px] text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {format(parseISO(backup.createdAt), 'yyyy/MM/dd HH:mm')}
                          </span>
                          <span className="flex items-center gap-1">
                            <ArrowUpDown className="w-3 h-3" />
                            {backup.size}
                          </span>
                          <Badge variant="secondary" className="h-4 text-[9px] px-1.5">{backup.type}</Badge>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" className="h-8 gap-2 border-primary/20 text-primary">
                        <Download className="w-3.5 h-3.5" />
                        تحميل
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                             <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" dir="rtl">
                           <DropdownMenuItem className="text-destructive gap-2">
                             <Trash2 className="w-4 h-4" />
                             حذف النسخة
                           </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Modals */}
      <AnimatePresence>
        {/* Backup Confirmation Modal */}
        <Dialog open={isBackupModalOpen} onOpenChange={setIsBackupModalOpen}>
          <DialogContent className="max-w-md" dir="rtl">
            <DialogHeader className="text-right">
              <DialogTitle className="flex items-center gap-2">
                <Database className="w-5 h-5 text-primary" />
                نسخ احتياطي لقاعدة البيانات
              </DialogTitle>
              <DialogDescription>
                سيتم إنشاء نسخة كاملة وآمنة من كافة البيانات الحالية في النظام.
              </DialogDescription>
            </DialogHeader>

            <div className="py-6 space-y-4">
              <div className="p-4 rounded-xl bg-primary/5 border border-primary/10 space-y-3">
                 <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">نوع النسخة:</span>
                    <span className="font-bold text-primary">Full System Backup</span>
                 </div>
                 <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">اسم الملف المقترح:</span>
                    <span className="font-mono text-[10px]" dir="ltr">backup_{format(new Date(), 'yyyy-MM-dd')}.zip</span>
                 </div>
              </div>

              {backupMutation.isPending && (
                <div className="space-y-2">
                  <div className="flex justify-between text-[10px] font-bold">
                    <span>جاري معالجة البيانات...</span>
                    <span>45%</span>
                  </div>
                  <Progress value={45} className="h-1.5" />
                </div>
              )}
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" disabled={backupMutation.isPending} onClick={() => setIsBackupModalOpen(false)}>إلغاء</Button>
              <Button 
                onClick={() => backupMutation.mutate()} 
                disabled={backupMutation.isPending}
                className="gap-2"
              >
                {backupMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                تأكيد وبدء النسخ
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Add Alert Placeholder Modal */}
        <Dialog open={isAddAlertModalOpen} onOpenChange={setIsAddAlertModalOpen}>
          <DialogContent className="max-w-md" dir="rtl">
            <DialogHeader className="text-right">
               <DialogTitle className="flex items-center gap-2">
                 <PlusCircle className="w-5 h-5 text-primary" />
                 إضافة تنبيه مخصص
               </DialogTitle>
               <DialogDescription>إعداد تنبيهات النظام لإرسالها عبر قنوات التواصل (واتساب/تيليجرام).</DialogDescription>
            </DialogHeader>
            <div className="py-10 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto">
                <Terminal className="w-8 h-8 opacity-20" />
              </div>
              <p className="text-sm text-muted-foreground font-medium">ميزة "إضافة تنبيه" قيد التطوير وستتوفر قريباً.</p>
            </div>
            <DialogFooter>
               <Button className="w-full" onClick={() => setIsAddAlertModalOpen(false)}>حسناً</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </AnimatePresence>
    </div>
  );
}

function List(props: any) {
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
      <line x1="8" y1="6" x2="21" y2="6" stroke="currentColor" fill="none" />
      <line x1="8" y1="12" x2="21" y2="12" stroke="currentColor" fill="none" />
      <line x1="8" y1="18" x2="21" y2="18" stroke="currentColor" fill="none" />
      <line x1="3" y1="6" x2="3.01" y2="6" stroke="currentColor" fill="none" />
      <line x1="3" y1="12" x2="3.01" y2="12" stroke="currentColor" fill="none" />
      <line x1="3" y1="18" x2="3.01" y2="18" stroke="currentColor" fill="none" />
    </svg>
  );
}
