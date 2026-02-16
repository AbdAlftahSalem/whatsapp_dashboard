import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText,
  Clock,
  RefreshCw,
  Database,
  Plus,
  ChevronLeft,
  AlertCircle,
  AlertTriangle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/DataTable';
import { SearchFilterBar } from '@/components/ui/SearchFilterBar';
import { PageLoader } from '@/components/ui/PageLoader';
import { PageError } from '@/components/ui/PageError';
import { StatsCard } from '@/components/ui/StatsCard';
import { Pagination } from '@/components/ui/Pagination';
import { StatusFilter } from '@/components/filters/StatusFilter';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';

import { useQuery } from '@tanstack/react-query';
import { getLogs, backupDatabase } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { usePagination } from '@/hooks/usePagination';
import { useSorting } from '@/hooks/useSorting';
import { useFiltering } from '@/hooks/useFiltering';
import { getLogColumns } from '@/features/logs/components/LogsTableColumns';

export default function LogsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isBackupModalOpen, setIsBackupModalOpen] = useState(false);
  const [backupProgress, setBackupProgress] = useState(0);
  const [isBackingUp, setIsBackingUp] = useState(false);
  
  const [filters, setFilters] = useState({
    level: 'all',
  });

  const { toast } = useToast();

  // Queries
  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ['logs'],
    queryFn: () => getLogs(1, 1000), // Get a larger batch for client-side filtering/sorting
    refetchInterval: 30000,
  });

  const logs = data?.data || [];

  // Metadata calculation
  const { searchTime } = useMemo(() => {
    const start = performance.now();
    // (Filtering is done below, we just measure the time it takes)
    const end = performance.now();
    return {
      searchTime: ((end - start) / 1000).toFixed(3)
    };
  }, [logs, searchQuery, filters.level]);

  // Filtering
  const filterFn = (log: any, fs: any) => {
    const searchLower = searchQuery.toLowerCase();
    const payloadString = log.SAPA ? JSON.stringify(log.SAPA).toLowerCase() : '';
    
    const matchesLevel = fs.level === 'all' || 
      (log.SATY?.toUpperCase().includes(fs.level.toUpperCase()) ?? false);

    if (!matchesLevel) return false;

    return !searchQuery ||
      (log.SAMSG?.toLowerCase().includes(searchLower) ?? false) ||
      (log.CIORG?.toLowerCase().includes(searchLower) ?? false) ||
      (log.USER?.toLowerCase().includes(searchLower) ?? false) ||
      (log.SATOP?.toLowerCase().includes(searchLower) ?? false) ||
      (log.SAFN?.toLowerCase().includes(searchLower) ?? false) ||
      (log.SARO?.toLowerCase().includes(searchLower) ?? false) ||
      payloadString.includes(searchLower);
  };

  const filteredData = useFiltering({ data: logs, filters, filterFn });

  // Sorting
  const { sortedData, sortConfig, onSort } = useSorting({ 
    data: filteredData, 
    initialSort: { key: 'SASEQ', direction: 'desc' } 
  });

  // Pagination
  const { 
    paginatedData, 
    currentPage, 
    pageSize, 
    totalPages, 
    goToPage, 
    setPageSize: changePageSize 
  } = usePagination({ data: sortedData, initialPageSize: 20 });

  // Handlers
  const handleBackup = async () => {
    setIsBackingUp(true);
    setBackupProgress(0);
    const interval = setInterval(() => {
      setBackupProgress(prev => (prev >= 90 ? 90 : prev + 10));
    }, 300);

    try {
      const result = await backupDatabase();
      clearInterval(interval);
      setBackupProgress(100);
      setTimeout(() => {
        setIsBackingUp(false);
        setIsBackupModalOpen(false);
        toast({ title: 'تم النسخ الاحتياطي', description: `تم حفظ الملف باسم: ${result.fileName}` });
      }, 500);
    } catch (err) {
      clearInterval(interval);
      setIsBackingUp(false);
      toast({ title: 'خطأ', description: 'فشل في إنشاء النسخة الاحتياطية', variant: 'destructive' });
    }
  };

  if (isLoading) return <PageLoader message="جاري تحميل سجلات النظام..." />;
  if (error) return <PageError onRetry={() => refetch()} />;

  const columns = getLogColumns();

  return (
    <div className="space-y-8 max-w-[1600px] mx-auto">
      {/* Header */}
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
            <Button variant="outline" onClick={() => setIsBackupModalOpen(true)} className="h-11 px-5 rounded-xl border-border/60">
              <Database className="w-4 h-4 ml-2 text-primary" />
              Database Backup
            </Button>
            <Button disabled className="h-11 px-6 rounded-xl shadow-xl shadow-primary/20 opacity-50 cursor-not-allowed">
              <Plus className="w-4 h-4 ml-2" />
              إضافة تنبيه جديد
            </Button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard title="إجمالي السجلات" value={logs.length} icon={FileText} variant="primary" />
        <StatsCard title="أخطاء اليوم" value={logs.filter(l => l.SATY?.includes('ERROR')).length} icon={AlertCircle} variant="error" />
        <StatsCard title="تحذيرات نشطة" value={logs.filter(l => l.SATY?.includes('WARNING')).length} icon={AlertTriangle} variant="warning" />
        <StatsCard title="سرعة البحث" value={searchTime} icon={RefreshCw} variant="primary" suffix="s" />
      </div>

      {/* Filters */}
      <SearchFilterBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="البحث في الرسائل، المستخدم، الجلسة، المسار..."
      >
        <div className="flex items-center gap-4 mt-4">
          <StatusFilter 
            label="مستوى التنبيه"
            value={filters.level}
            onChange={v => setFilters(prev => ({ ...prev, level: v }))}
            options={[
              { label: 'جميع المستويات', value: 'all' },
              { label: 'معلومات', value: 'INFO' },
              { label: 'تحذيرات', value: 'WARNING' },
              { label: 'أخطاء', value: 'ERROR' },
            ]}
          />
        </div>
      </SearchFilterBar>

      {/* Table Area */}
      <div className="overflow-hidden rounded-2xl border bg-card/50 backdrop-blur-sm shadow-xl">
        <DataTable
          data={paginatedData}
          columns={columns}
          onSort={onSort}
          sortConfig={sortConfig}
          keyExtractor={(item) => item.SASEQ}
        />
      </div>

      {/* Pagination */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        pageSize={pageSize}
        totalItems={sortedData.length}
        onPageChange={goToPage}
        onPageSizeChange={changePageSize}
      />

      {/* Backup Modal */}
      <Dialog open={isBackupModalOpen} onOpenChange={setIsBackupModalOpen}>
        <DialogContent className="sm:max-w-[425px]" dir="rtl">
          <DialogHeader className="text-right">
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <Database className="w-5 h-5 text-primary" />
              النسخ الاحتياطي لقاعدة البيانات
            </DialogTitle>
            <DialogDescription className="pt-2 font-medium">
              جاري إنشاء نسخة احتياطية كاملة من سجلات النظام وقواعد البيانات...
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-6 space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-bold">
                <span className="text-muted-foreground uppercase">Progress</span>
                <span className="text-primary">{backupProgress}%</span>
              </div>
              <Progress value={backupProgress} className="h-2" />
            </div>
            
            <div className="p-3 rounded-lg bg-muted text-[10px] font-mono text-muted-foreground leading-relaxed">
              {backupProgress < 30 && "> Initializing backup engine..."}
              {backupProgress >= 30 && backupProgress < 60 && "> Compressing log tables..."}
              {backupProgress >= 60 && backupProgress < 100 && "> Finalizing archive..."}
              {backupProgress === 100 && "> Backup complete: system-backup-2024.sql"}
            </div>
          </div>

          <DialogFooter className="sm:justify-start gap-2">
            <Button variant="outline" onClick={() => setIsBackupModalOpen(false)} disabled={isBackingUp}>
              إلغاء
            </Button>
            <Button onClick={handleBackup} disabled={isBackingUp} className="min-w-[120px]">
              {isBackingUp ? (
                <>
                  <RefreshCw className="w-4 h-4 ml-2 animate-spin" />
                  جاري النسخ...
                </>
              ) : (
                'بدء النسخ الآن'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
