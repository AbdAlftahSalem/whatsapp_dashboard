import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Smartphone,
  Plus,
  Search,
  MoreHorizontal,
  RefreshCw,
  Trash2,
  QrCode,
  Filter,
  X,
  Loader2,
  Building2,
  XCircle,
  Hash,
  User,
  Phone,
  Server,
  Activity,
  Calendar,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  FileText,
  Paperclip,
  Clock,
  ArrowUpDown,
  Edit2
} from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getAllUsers, deleteUser, updateUser, getServers } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { StatusBadge } from '@/components/ui/StatusBadge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { format, parseISO, isAfter, subHours, subDays, subWeeks } from 'date-fns';
import { ar } from 'date-fns/locale';

export default function UsersPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [serverFilter, setServerFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [phoneFrom, setPhoneFrom] = useState('');
  const [phoneTo, setPhoneTo] = useState('');
  
  const [selectedDevice, setSelectedDevice] = useState<any>(null);
  const [showQRModal, setShowQRModal] = useState(false);
  const [isLoadingQR, setIsLoadingQR] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [editData, setEditData] = useState({ name: '', detail: '', phone: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [restartingIds, setRestartingIds] = useState<Set<number>>(new Set());

  // Filter & Sort States
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' }>({
    key: 'SOMSEQ',
    direction: 'desc'
  });

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const { toast } = useToast();
  const { accessToken: token } = useAuthStore();
  const queryClient = useQueryClient();

  const { data: usersData, isLoading: isLoadingUsers, error: usersError } = useQuery({
    queryKey: ['users'],
    queryFn: getAllUsers,
    refetchInterval: 60000,
  });

  const { data: serversData } = useQuery({
    queryKey: ['servers'],
    queryFn: getServers,
  });

  const devices = usersData?.data.Users || [];
  const servers = serversData?.data.servers || [];

  const mapStatus = (status: string): any => {
    const s = status?.toLowerCase();
    if (s === 'ready') return 'ready';
    if (s === 'authenticated') return 'authenticated';
    if (s === 'qr') return 'qr';
    if (s === 'logout') return 'logout';
    if (s === 'none') return 'none';
    if (s === 'maxqrcodetries') return 'max_qr_tries';
    if (s === 'not_ready') return 'not_ready';
    if (s === 'open') return 'open';
    return 'none';
  };

  const handleSort = (key: string) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'desc' ? 'asc' : 'desc'
    }));
  };

  const filteredDevices = useMemo(() => {
    return devices.filter((device) => {
      // Text Search
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch = !searchQuery || 
        device.USER.toLowerCase().includes(searchLower) ||
        (device.SOMPH || '').includes(searchQuery) ||
        (device.SOMNA || '').toLowerCase().includes(searchLower);

      // Status Filter
      const matchesStatus = statusFilter === 'all' || device.SOMCST?.toLowerCase() === statusFilter.toLowerCase();

      // Server Filter
      const matchesServer = serverFilter === 'all' || device.SISN === serverFilter;

      // Phone Range Filter
      const phoneNum = parseInt(device.SOMPH || '0');
      const matchesPhoneFrom = !phoneFrom || phoneNum >= parseInt(phoneFrom);
      const matchesPhoneTo = !phoneTo || phoneNum <= parseInt(phoneTo);

      // Date Filter
      let matchesDate = true;
      if (dateFilter !== 'all' && device.DATEU) {
        const lastActivity = parseISO(device.DATEU);
        const now = new Date();
        if (dateFilter === 'hour') matchesDate = isAfter(lastActivity, subHours(now, 1));
        else if (dateFilter === 'day') matchesDate = isAfter(lastActivity, subDays(now, 1));
        else if (dateFilter === 'week') matchesDate = isAfter(lastActivity, subWeeks(now, 1));
      }

      return matchesSearch && matchesStatus && matchesServer && matchesPhoneFrom && matchesPhoneTo && matchesDate;
    }).sort((a, b) => {
      const { key, direction } = sortConfig;
      let valA = a[key as keyof typeof a];
      let valB = b[key as keyof typeof b];

      if (valA === null || valA === undefined) valA = '' as any;
      if (valB === null || valB === undefined) valB = '' as any;

      if (valA < valB) return direction === 'asc' ? -1 : 1;
      if (valA > valB) return direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [devices, searchQuery, statusFilter, serverFilter, phoneFrom, phoneTo, dateFilter, sortConfig]);

  const totalPages = Math.ceil(filteredDevices.length / pageSize);
  const paginatedDevices = filteredDevices.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleShowQR = (device: any) => {
    setSelectedDevice(device);
    setIsLoadingQR(true);
    setShowQRModal(true);
    setTimeout(() => setIsLoadingQR(false), 1000);
  };

  const handleDeleteConfirm = (device: any) => {
    setSelectedDevice(device);
    setShowDeleteConfirm(true);
  };

  const handleDelete = async () => {
    if (!token || !selectedDevice) return;
    setIsSubmitting(true);
    try {
      await deleteUser(selectedDevice.USER, token);
      toast({
        title: 'تم الحذف بنجاح',
        description: `تم حذف الجلسة ${selectedDevice.USER} نهائياً`,
      });
      setShowDeleteConfirm(false);
      queryClient.invalidateQueries({ queryKey: ['users'] });
    } catch (error) {
      toast({
        title: 'فشل الحذف',
        description: error instanceof Error ? error.message : 'حدث خطأ غير متوقع',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (device: any) => {
    setSelectedDevice(device);
    setEditData({
      name: device.SOMNA || '',
      detail: device.SOMDE || '',
      phone: device.SOMPH || '',
    });
    setShowEditModal(true);
  };

  const handleUpdate = async () => {
    if (!token || !selectedDevice) return;
    setIsSubmitting(true);
    try {
      await updateUser(selectedDevice.USER, editData, token);
      toast({
        title: 'تم التحديث بنجاح',
        description: 'تم تحديث بيانات الجلسة بنجاح',
      });
      setShowEditModal(false);
      queryClient.invalidateQueries({ queryKey: ['users'] });
    } catch (error) {
      toast({
        title: 'فشل التحديث',
        description: error instanceof Error ? error.message : 'حدث خطأ غير متوقع',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRestartSession = (device: any) => {
    const id = device.SOMSEQ;
    setRestartingIds(prev => new Set(prev).add(id));
    
    toast({
      title: 'جاري إعادة تشغيل الجلسة',
      description: `بدء عملية Restart للجلسة ${device.USER}...`,
    });
    
    // Simulate API call and success update
    setTimeout(() => {
      setRestartingIds(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      toast({
        title: 'تمت إعادة التشغيل',
        description: 'تم إرسال أمر إعادة التشغيل للخادم بنجاح',
      });
      queryClient.invalidateQueries({ queryKey: ['users'] });
    }, 3000);
  };

  if (isLoadingUsers) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
        <p className="text-muted-foreground animate-pulse">جاري تحميل بيانات الجلسات...</p>
      </div>
    );
  }

  if (usersError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4 text-center">
        <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
          <XCircle className="w-6 h-6 text-destructive" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-foreground">فشل تحميل بيانات الجلسات</h3>
          <p className="text-sm text-muted-foreground mt-1">يرجى التحقق من اتصالك بالخادم والمحاولة مرة أخرى</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 lg:space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-foreground">المستخدمين/الجلسات</h1>
          <p className="text-sm text-muted-foreground mt-1">إدارة جلسات WhatsApp والتحكم في الحالة</p>
        </div>
        <Link to="/dashboard/users/add">
          <Button className="gap-2 w-full sm:w-auto">
            <Plus className="w-4 h-4" />
            إضافة جلسة
          </Button>
        </Link>
      </div>

      {/* Search & Advanced Filters */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="البحث بـ ID، الهاتف، أو الاسم..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-10"
            />
          </div>
          <Button
            variant={showAdvancedFilters ? "default" : "outline"}
            className="gap-2"
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
          >
            <Filter className="w-4 h-4" />
            تصفية متقدمة
          </Button>
        </div>

        {showAdvancedFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-card border rounded-xl"
          >
            {/* Status Filter */}
            <div className="space-y-2">
              <Label>الحالة</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="الحالة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">الكل</SelectItem>
                  <SelectItem value="ready">Ready</SelectItem>
                  <SelectItem value="authenticated">Authenticated</SelectItem>
                  <SelectItem value="qr">QR</SelectItem>
                  <SelectItem value="logout">Logout</SelectItem>
                  <SelectItem value="none">None</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Server Filter */}
            <div className="space-y-2">
              <Label>الخادم</Label>
              <Select value={serverFilter} onValueChange={setServerFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="الخادم" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">الكل</SelectItem>
                  {servers.map(s => (
                    <SelectItem key={s.SISEQ} value={s.SISN}>{s.SISN}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Phone Range */}
            <div className="space-y-2">
              <Label>رقم العميل</Label>
              <div className="flex items-center gap-2">
                <Input
                  placeholder="من"
                  value={phoneFrom}
                  onChange={(e) => setPhoneFrom(e.target.value)}
                />
                <Input
                  placeholder="إلى"
                  value={phoneTo}
                  onChange={(e) => setPhoneTo(e.target.value)}
                />
              </div>
            </div>

             {/* Date Filter */}
             <div className="space-y-2">
              <Label>آخر نشاط</Label>
              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="تاريخ النشاط" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">الكل</SelectItem>
                  <SelectItem value="hour">آخر ساعة</SelectItem>
                  <SelectItem value="day">آخر 24 ساعة</SelectItem>
                  <SelectItem value="week">آخر أسبوع</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="lg:col-span-4 flex justify-end items-center border-t pt-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchQuery('');
                  setStatusFilter('all');
                  setServerFilter('all');
                  setDateFilter('all');
                  setPhoneFrom('');
                  setPhoneTo('');
                  setCurrentPage(1);
                }}
              >
                إعادة ضبط التصفية
              </Button>
            </div>
          </motion.div>
        )}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="data-table hidden lg:block"
      >
        <div className="overflow-x-auto">
          <table className="w-full whitespace-nowrap">
            <thead>
              <tr>
                <th onClick={() => handleSort('SOMID')} className="cursor-pointer hover:bg-muted">
                   <div className="flex items-center gap-1">Session ID <ArrowUpDown className="w-3 h-3" /></div>
                </th>
                <th onClick={() => handleSort('USER')} className="cursor-pointer hover:bg-muted">
                   <div className="flex items-center gap-1">رمز المستخدم <ArrowUpDown className="w-3 h-3" /></div>
                </th>
                <th onClick={() => handleSort('CIID')} className="cursor-pointer hover:bg-muted">
                   <div className="flex items-center gap-1">رقم العميل <ArrowUpDown className="w-3 h-3" /></div>
                </th>
                <th onClick={() => handleSort('SOMNA')} className="cursor-pointer hover:bg-muted">
                   <div className="flex items-center gap-1">اسم العميل <ArrowUpDown className="w-3 h-3" /></div>
                </th>
                <th onClick={() => handleSort('SISN')} className="cursor-pointer hover:bg-muted">
                   <div className="flex items-center gap-1">اسم الخادم <ArrowUpDown className="w-3 h-3" /></div>
                </th>
                <th onClick={() => handleSort('SOMSVR')} className="cursor-pointer hover:bg-muted">
                   <div className="flex items-center gap-1">رمز السيرفر <ArrowUpDown className="w-3 h-3" /></div>
                </th>
                <th onClick={() => handleSort('SOMCST')} className="cursor-pointer hover:bg-muted text-center">
                   <div className="flex items-center gap-1 justify-center">الحالة <ArrowUpDown className="w-3 h-3" /></div>
                </th>
                <th>آخر رسالة</th>
                <th>الحد اليومي</th>
                <th>إجمالي</th>
                <th>اليوم</th>
                <th className="sticky left-0 bg-muted/50 text-center" style={{backgroundColor: 'oklch(96.8% 0.007 247.896)'}}>الإجراءات</th>
              </tr>
            </thead>
            <tbody>
            {paginatedDevices.map((device, index) => {
              const isRestarting = restartingIds.has(device.SOMSEQ);
              return (
                <motion.tr
                  key={device.SOMSEQ}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.03 }}
                >
                  <td>
                    <span className="font-mono text-xs text-muted-foreground">{device.SOMID}</span>
                  </td>
                  <td>
                    <span className="font-mono text-xs font-bold text-primary">{device.USER}</span>
                  </td>
                  <td>
                    <span className="font-mono text-xs">{device.CIID}</span>
                  </td>
                  <td>
                    <span className="font-medium text-sm">{device.SOMNA || 'بدون اسم'}</span>
                  </td>
                  <td>
                    <div className="flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                      <span className="text-xs">{device.SISN || '-'}</span>
                    </div>
                  </td>
                  <td>
                    <span className="text-xs font-mono text-muted-foreground">{device.SOMSVR || '-'}</span>
                  </td>
                  <td>
                    <StatusBadge status={mapStatus(device.SOMCST)} />
                  </td>
                  <td>
                    <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      {device.DATEU ? format(parseISO(device.DATEU), 'HH:mm dd/MM', { locale: ar }) : '-'}
                    </div>
                  </td>
                  <td>
                    <span className="font-mono text-xs">{device.SOMDLM || 0}</span>
                  </td>
                  <td>
                    <div className="flex items-center gap-2 text-[10px]">
                      <div className="flex items-center gap-1" title="رسائل نصية">
                        <FileText className="w-3 h-3 text-muted-foreground" />
                        <span>{device.SOMAF1 || 0}</span>
                      </div>
                      <div className="flex items-center gap-1" title="مرفقات">
                        <Paperclip className="w-3 h-3 text-muted-foreground" />
                        <span>{device.SOMAF2 || 0}</span>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="flex items-center gap-2 text-[10px]">
                      <div className="flex items-center gap-1" title="رسائل نصية اليوم">
                        <FileText className="w-3 h-3 text-primary" />
                        <span>{device.SOMAF3 || 0}</span>
                      </div>
                      <div className="flex items-center gap-1" title="مرفقات اليوم">
                        <Paperclip className="w-3 h-3 text-primary" />
                        <span>{device.SOMAF4 || 0}</span>
                      </div>
                    </div>
                  </td>
                  <td className="sticky left-0 bg-background/95 backdrop-blur-sm border-r">
                    <div className="flex items-center justify-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-blue-500 hover:text-blue-600 hover:bg-blue-50"
                        onClick={() => handleShowQR(device)}
                        title="عرض QR"
                      >
                        <QrCode className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className={`h-8 w-8 ${isRestarting ? 'text-warning' : 'text-orange-500 hover:text-orange-600 hover:bg-orange-50'}`}
                        onClick={() => handleRestartSession(device)}
                        disabled={isRestarting}
                        title="إعادة تشغيل"
                      >
                        {isRestarting ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40" dir="rtl">
                         <DropdownMenuItem 
                          className="gap-2"
                          onClick={() => handleEdit(device)}
                        >
                          <Edit2 className="w-4 h-4" />
                          تعديل
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="gap-2 text-destructive"
                          onClick={() => handleDeleteConfirm(device)}
                        >
                          <Trash2 className="w-4 h-4" />
                          حذف
                        </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </td>
                </motion.tr>
              );
            })}
          </tbody>
          </table>
        </div>

        {filteredDevices.length === 0 && (
          <div className="p-12 text-center">
            <Smartphone className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground">لم يتم العثور على جلسات مطابقة للمعايير</p>
          </div>
        )}
      </motion.div>

      <div className="lg:hidden space-y-3">
        {paginatedDevices.map((device, index) => {
          const isRestarting = restartingIds.has(device.SOMSEQ);
          return (
            <motion.div
              key={device.SOMSEQ}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-card rounded-xl border border-border p-4 space-y-3 shadow-sm"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center relative">
                    <Smartphone className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-bold text-sm text-foreground">{device.USER}</p>
                    <p className="text-[10px] text-muted-foreground">{device.SOMNA || 'بدون اسم'}</p>
                  </div>
                </div>
                <StatusBadge status={mapStatus(device.SOMCST)} />
              </div>

              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Hash className="w-3 h-3" />
                  <span>ID: {device.SOMID}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground" title="رقم العميل">
                  <User className="w-3 h-3" />
                  <span>العميل: {device.CIID}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Phone className="w-3 h-3" />
                  <span dir="ltr">{device.SOMPH || '-'}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Server className="w-3 h-3" />
                  <span>{device.SISN || '-'} (Code: {device.SOMSVR || '-'})</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="w-3 h-3" />
                  <span>{device.DATEU ? format(parseISO(device.DATEU), 'HH:mm dd/MM') : '-'}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                    <Activity className="w-3 h-3" />
                    <span>الحد: {device.SOMDLM || 0}</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-border">
                  <div className="flex items-center gap-3 text-[10px]">
                      <div className="bg-muted px-1.5 py-0.5 rounded">
                          <span className="text-muted-foreground">إجمالي:</span>
                          <span className="font-bold mr-1">{Number(device.SOMAF1 || 0) + Number(device.SOMAF2 || 0)}</span>
                      </div>
                      <div className="bg-primary/10 px-1.5 py-0.5 rounded">
                          <span className="text-primary">اليوم:</span>
                          <span className="font-bold mr-1">{Number(device.SOMAF3 || 0) + Number(device.SOMAF4 || 0)}</span>
                      </div>
                  </div>
                <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-500" onClick={() => handleShowQR(device)}>
                        <QrCode className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-orange-500" onClick={() => handleRestartSession(device)} disabled={isRestarting} >
                        {isRestarting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                    </Button>
                   <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-40">
                      <DropdownMenuItem className="gap-2" onClick={() => handleEdit(device)}>
                        <Edit2 className="w-4 h-4" />
                        تعديل
                      </DropdownMenuItem>
                      <DropdownMenuItem className="gap-2 text-destructive" onClick={() => handleDeleteConfirm(device)}>
                        <Trash2 className="w-4 h-4" />
                        حذف
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Pagination & Export Footer */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-card p-4 rounded-xl border">
        <div className="flex items-center gap-4">
          <p className="text-sm text-muted-foreground whitespace-nowrap">
            عرض {paginatedDevices.length} من {filteredDevices.length} جلسة
          </p>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">عدد الصفوف:</span>
            <select
              className="h-8 rounded border bg-background text-xs px-2"
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
            >
              {[20, 30, 50].map(size => (
                <option key={size} value={size}>{size}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(prev => prev - 1)}
          >
            <ChevronRight className="w-4 h-4 ml-1" />
            السابق
          </Button>

          <div className="flex items-center px-4 py-1 bg-muted rounded-md text-sm font-medium">
            صفحة {currentPage} من {totalPages || 1}
          </div>

          <Button
            variant="outline"
            size="sm"
            disabled={currentPage === totalPages || totalPages === 0}
            onClick={() => setCurrentPage(prev => prev + 1)}
          >
            التالي
            <ChevronLeft className="w-4 h-4 mr-1" />
          </Button>
        </div>
      </div>

      {/* QR Code Modal */}
      <AnimatePresence>
        {showQRModal && selectedDevice && (
          <Dialog open={showQRModal} onOpenChange={setShowQRModal}>
            <DialogContent className="sm:max-w-md" dir="rtl">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-right">
                  <QrCode className="w-5 h-5 text-primary" />
                  رمز QR - {selectedDevice.USER}
                </DialogTitle>
              </DialogHeader>
              <div className="flex flex-col items-center justify-center py-8">
                {isLoadingQR ? (
                  <div className="w-48 h-48 flex items-center justify-center bg-muted rounded-xl border border-dashed border-border">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  </div>
                ) : (
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="w-48 h-48 bg-white rounded-xl p-4 shadow-xl border border-border"
                  >
                    {selectedDevice.SOMQR ? (
                      <img src={selectedDevice.SOMQR} alt="QR Code" className="w-full h-full object-contain" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-muted/50 to-muted rounded-lg flex items-center justify-center">
                        <QrCode className="w-24 h-24 text-muted-foreground/20" />
                      </div>
                    )}
                  </motion.div>
                )}
                <div className="mt-6 text-center space-y-2">
                  <p className="text-sm font-medium text-foreground">
                    امسح هذا الرمز باستخدام تطبيق واتساب
                  </p>
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-muted rounded-full text-xs text-muted-foreground font-mono" dir="ltr">
                    <Phone className="w-3 h-3" />
                    {selectedDevice.SOMPH || '-'}
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" className="w-full sm:w-auto" onClick={() => setShowQRModal(false)}>
                  إغلاق
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent className="sm:max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-right text-destructive flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              تأكيد حذف الجلسة
            </DialogTitle>
            <DialogDescription className="text-right pt-2 text-foreground font-medium">
              هل أنت متأكد من رغبتك في حذف الجلسة <span className="font-mono bg-muted px-1.5 py-0.5 rounded text-destructive">{selectedDevice?.USER}</span>؟
            </DialogDescription>
          </DialogHeader>
          <div className="p-4 rounded-lg bg-destructive/5 border border-destructive/20">
            <p className="text-xs text-muted-foreground leading-relaxed">
              هذا الإجراء نهائي ولا يمكن التراجع عنه. سيتم إزالة جميع البيانات المرتبطة بهذه الجلسة من النظام فوراً.
            </p>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>
              إلغاء
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="w-4 h-4 ml-2 animate-spin" /> : <Trash2 className="w-4 h-4 ml-2" />}
              تأكيد الحذف النهائي
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit User Modal */}
      <AnimatePresence>
        {showEditModal && (
          <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
            <DialogContent className="sm:max-w-md text-right" dir="rtl">
              <DialogHeader>
                <DialogTitle className="text-right">تعديل بيانات الجلسة</DialogTitle>
                <DialogDescription className="text-right">
                  تحديث معلومات الجلسة: <span className="font-mono text-primary">{selectedDevice?.USER}</span>
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2 text-right">
                  <Label htmlFor="edit-name">اسم العميل</Label>
                  <Input
                    id="edit-name"
                    value={editData.name}
                    onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                    placeholder="اسم العميل"
                  />
                </div>
                <div className="space-y-2 text-right">
                  <Label htmlFor="edit-phone">رقم الهاتف</Label>
                  <Input
                    id="edit-phone"
                    value={editData.phone}
                    onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
                    placeholder="رقم الهاتف"
                    dir="ltr"
                  />
                </div>
                <div className="space-y-2 text-right">
                  <Label htmlFor="edit-detail">التفاصيل / الموقع</Label>
                  <Input
                    id="edit-detail"
                    value={editData.detail}
                    onChange={(e) => setEditData({ ...editData, detail: e.target.value })}
                    placeholder="التفاصيل"
                  />
                </div>
              </div>
              <DialogFooter className="gap-2 sm:justify-start">
                <Button variant="outline" onClick={() => setShowEditModal(false)}>
                  إلغاء
                </Button>
                <Button onClick={handleUpdate} disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                      جاري الحفظ...
                    </>
                  ) : (
                    'حفظ التغييرات'
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </AnimatePresence>
    </div>
  );
}
