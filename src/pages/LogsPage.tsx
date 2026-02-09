import { useState } from 'react';
import { motion } from 'framer-motion';
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
import { useToast } from '@/hooks/use-toast';

interface LogEntry {
  id: number;
  timestamp: string;
  level: 'info' | 'warning' | 'error' | 'success';
  message: string;
  source: string;
  details?: string;
}

// Mock data
const mockLogs: LogEntry[] = [
  { id: 1, timestamp: '2024-01-15 14:32:45', level: 'success', message: 'تم إرسال الرسالة بنجاح', source: 'WhatsApp API', details: 'Message ID: MSG123456' },
  { id: 2, timestamp: '2024-01-15 14:30:12', level: 'error', message: 'فشل في الاتصال بالخادم', source: 'Server Connection', details: 'Connection timeout after 30s' },
  { id: 3, timestamp: '2024-01-15 14:28:33', level: 'warning', message: 'ارتفاع استخدام الذاكرة', source: 'System Monitor', details: 'RAM usage at 85%' },
  { id: 4, timestamp: '2024-01-15 14:25:18', level: 'info', message: 'تم تسجيل دخول المسؤول', source: 'Auth System', details: 'Admin: admin@example.com' },
  { id: 5, timestamp: '2024-01-15 14:22:05', level: 'success', message: 'تم إضافة عميل جديد', source: 'Customer Service', details: 'Customer ID: CUST789' },
  { id: 6, timestamp: '2024-01-15 14:18:42', level: 'error', message: 'خطأ في قاعدة البيانات', source: 'Database', details: 'Query failed: timeout' },
  { id: 7, timestamp: '2024-01-15 14:15:30', level: 'warning', message: 'جلسة واتساب غير مستقرة', source: 'WhatsApp Session', details: 'Device: DEV456' },
  { id: 8, timestamp: '2024-01-15 14:12:15', level: 'info', message: 'تم تحديث الإعدادات', source: 'Settings', details: 'Changed by admin' },
  { id: 9, timestamp: '2024-01-15 14:08:55', level: 'success', message: 'تم إعادة تشغيل الخادم', source: 'Server Management', details: 'Server: Main Server' },
  { id: 10, timestamp: '2024-01-15 14:05:22', level: 'info', message: 'بدء النسخ الاحتياطي', source: 'Backup Service', details: 'Type: Full backup' },
];

export default function LogsPage() {
  const [logs, setLogs] = useState<LogEntry[]>(mockLogs);
  const [searchQuery, setSearchQuery] = useState('');
  const [levelFilter, setLevelFilter] = useState<string>('all');
  const [isClearModalOpen, setIsClearModalOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { toast } = useToast();

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      log.message.includes(searchQuery) ||
      log.source.includes(searchQuery) ||
      (log.details?.includes(searchQuery) ?? false);
    const matchesLevel = levelFilter === 'all' || log.level === levelFilter;
    return matchesSearch && matchesLevel;
  });

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      toast({ title: 'تم تحديث السجلات' });
    }, 1000);
  };

  const handleClearLogs = () => {
    // Simulate backup
    toast({ title: 'جاري حفظ النسخة الاحتياطية...' });
    setTimeout(() => {
      setLogs([]);
      setIsClearModalOpen(false);
      toast({ title: 'تم مسح السجلات وحفظ النسخة الاحتياطية' });
    }, 1500);
  };

  const handleExportLogs = () => {
    const logsText = logs.map(log => 
      `[${log.timestamp}] [${log.level.toUpperCase()}] ${log.source}: ${log.message}${log.details ? ` - ${log.details}` : ''}`
    ).join('\n');
    
    const blob = new Blob([logsText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `logs_${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    
    toast({ title: 'تم تصدير السجلات بنجاح' });
  };

  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'success': return <CheckCircle className="w-4 h-4 text-success" />;
      case 'error': return <AlertCircle className="w-4 h-4 text-destructive" />;
      case 'warning': return <AlertTriangle className="w-4 h-4 text-warning" />;
      case 'info': return <Info className="w-4 h-4 text-primary" />;
      default: return null;
    }
  };

  const getLevelBadgeClass = (level: string) => {
    switch (level) {
      case 'success': return 'badge-success';
      case 'error': return 'badge-error';
      case 'warning': return 'badge-warning';
      case 'info': return 'bg-primary/10 text-primary';
      default: return 'badge-neutral';
    }
  };

  const getLevelLabel = (level: string) => {
    switch (level) {
      case 'success': return 'نجاح';
      case 'error': return 'خطأ';
      case 'warning': return 'تحذير';
      case 'info': return 'معلومة';
      default: return level;
    }
  };

  const logCounts = {
    all: logs.length,
    info: logs.filter(l => l.level === 'info').length,
    success: logs.filter(l => l.level === 'success').length,
    warning: logs.filter(l => l.level === 'warning').length,
    error: logs.filter(l => l.level === 'error').length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-foreground">سجلات النظام</h1>
          <p className="text-sm text-muted-foreground mt-1">عرض وإدارة سجلات النظام</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleRefresh} disabled={isRefreshing}>
            <RefreshCw className={`w-4 h-4 ml-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            تحديث
          </Button>
          <Button variant="outline" onClick={handleExportLogs}>
            <Download className="w-4 h-4 ml-2" />
            تصدير
          </Button>
          <Button variant="destructive" onClick={() => setIsClearModalOpen(true)}>
            <Trash2 className="w-4 h-4 ml-2" />
            مسح السجلات
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="p-3 rounded-xl bg-muted/30 border border-border text-center">
          <p className="text-2xl font-bold text-foreground">{logCounts.all}</p>
          <p className="text-xs text-muted-foreground">إجمالي السجلات</p>
        </div>
        <div className="p-3 rounded-xl bg-primary/5 border border-primary/20 text-center">
          <p className="text-2xl font-bold text-primary">{logCounts.info}</p>
          <p className="text-xs text-muted-foreground">معلومات</p>
        </div>
        <div className="p-3 rounded-xl bg-success/5 border border-success/20 text-center">
          <p className="text-2xl font-bold text-success">{logCounts.success}</p>
          <p className="text-xs text-muted-foreground">نجاح</p>
        </div>
        <div className="p-3 rounded-xl bg-warning/5 border border-warning/20 text-center">
          <p className="text-2xl font-bold text-warning">{logCounts.warning}</p>
          <p className="text-xs text-muted-foreground">تحذيرات</p>
        </div>
        <div className="p-3 rounded-xl bg-destructive/5 border border-destructive/20 text-center">
          <p className="text-2xl font-bold text-destructive">{logCounts.error}</p>
          <p className="text-xs text-muted-foreground">أخطاء</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="البحث في السجلات..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pr-10"
          />
        </div>
        <Select value={levelFilter} onValueChange={setLevelFilter}>
          <SelectTrigger className="w-full sm:w-40">
            <Filter className="w-4 h-4 ml-2" />
            <SelectValue placeholder="جميع المستويات" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">جميع المستويات</SelectItem>
            <SelectItem value="info">معلومات</SelectItem>
            <SelectItem value="success">نجاح</SelectItem>
            <SelectItem value="warning">تحذيرات</SelectItem>
            <SelectItem value="error">أخطاء</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Logs List */}
      <div className="stats-card p-0 overflow-hidden">
        <div className="divide-y divide-border">
          {filteredLogs.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>لا توجد سجلات</p>
            </div>
          ) : (
            filteredLogs.map((log, index) => (
              <motion.div
                key={log.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.03 }}
                className="p-4 hover:bg-muted/30 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div className="mt-1">{getLevelIcon(log.level)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${getLevelBadgeClass(log.level)}`}>
                        {getLevelLabel(log.level)}
                      </span>
                      <span className="text-xs text-muted-foreground">{log.source}</span>
                    </div>
                    <p className="text-sm text-foreground">{log.message}</p>
                    {log.details && (
                      <p className="text-xs text-muted-foreground mt-1" dir="ltr">
                        {log.details}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
                    <Clock className="w-3 h-3" />
                    <span dir="ltr">{log.timestamp}</span>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>

      {/* Clear Logs Modal */}
      <Dialog open={isClearModalOpen} onOpenChange={setIsClearModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>مسح السجلات</DialogTitle>
            <DialogDescription>
              سيتم حفظ نسخة احتياطية من السجلات قبل المسح. هل أنت متأكد؟
            </DialogDescription>
          </DialogHeader>
          <div className="p-4 rounded-lg bg-warning/10 border border-warning/20">
            <div className="flex items-center gap-2 text-warning">
              <AlertTriangle className="w-5 h-5" />
              <span className="font-medium">تحذير</span>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              سيتم مسح جميع السجلات الحالية ({logs.length} سجل). سيتم حفظ نسخة احتياطية تلقائياً.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsClearModalOpen(false)}>إلغاء</Button>
            <Button variant="destructive" onClick={handleClearLogs}>
              مسح وحفظ نسخة احتياطية
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}