
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
  CheckCircle2,
  AlertCircle,
  Wifi,
  WifiOff,
  AlertTriangle,
  History,
  Server as ServerIcon,
} from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getAllUsersFull, deleteUser, updateUser, getQrCode, restartSession, stopSession } from '@/lib/api';
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
  const [pageSize, setPageSize] = useState(20);
  const [currentPage, setCurrentPage] = useState(1);

  const { toast } = useToast();
  const { accessToken: token } = useAuthStore();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const orgFilter = searchParams.get('org');

  const { data: usersData, isLoading, error } = useQuery({
    queryKey: ['users-full', orgFilter],
    queryFn: getAllUsersFull,
  });

  const devices = usersData?.data.data || [];

  const SessionStatus = ({ status }: { status: string }) => {
    const s = String(status).toLowerCase();
    switch (s) {
      case 'ready':
        return (
          <div className="flex items-center gap-1.5 text-success">
            <Wifi className="w-4 h-4" />
            <span className="text-xs font-medium uppercase">Ready</span>
          </div>
        );
      case 'logout':
        return (
          <div className="flex items-center gap-1.5 text-destructive">
            <XCircle className="w-4 h-4" />
            <span className="text-xs font-medium uppercase">Logout</span>
          </div>
        );
      case 'qr':
        return (
          <div className="flex items-center gap-1.5 text-warning">
            <WifiOff className="w-4 h-4" />
            <span className="text-xs font-medium uppercase">QR</span>
          </div>
        );
      case 'authenticated':
        return (
          <div className="flex items-center gap-1.5 text-blue-500">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-xs font-medium uppercase">authenticated</span>
          </div>
        );
      case 'maxqrcodetries':
        return (
          <div className="flex items-center gap-1.5 text-warning">
            <AlertTriangle className="w-4 h-4" />
            <span className="text-xs font-medium uppercase">MaxQR</span>
          </div>
        );
      case 'none':
        return (
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <WifiOff className="w-4 h-4" />
            <span className="text-xs font-medium uppercase">None</span>
          </div>
        );
      default:
        // Default "Not Ready" style if not matched above
        return (
          <div className="flex items-center gap-1.5 text-destructive">
            <AlertCircle className="w-4 h-4" />
            <span className="text-xs font-medium uppercase">{status || 'Not Ready'}</span>
          </div>
        );
    }
  };

  const filteredDevices = devices.filter((device) => {
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch =
      (device.SOMNA && device.SOMNA.toLowerCase().includes(searchLower)) ||
      (device.user_name && device.user_name.toLowerCase().includes(searchLower)) ||
      (device.customer_name && device.customer_name.toLowerCase().includes(searchLower)) ||
      (device.session_id && device.session_id.includes(searchQuery)) ||
      (device.server_name && device.server_name.toLowerCase().includes(searchLower)) ||
      (String(device.customer_number).includes(searchQuery));

    const matchesOrg = !orgFilter || String(device.customer_number) === orgFilter;

    return matchesSearch && matchesOrg;
  });

  const totalPages = Math.ceil(filteredDevices.length / pageSize);
  const paginatedDevices = filteredDevices.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const handleShowQR = async (device: any) => {
    setSelectedDevice(device);
    setIsLoadingQR(true);
    setShowQRModal(true);

    try {
      const userId = String(device.session_id || device.user_code);
      const response = await getQrCode(userId);
      console.log("QR Response:", response);

      const qrCode = response.data?.qr || response.data?.qrcode || (typeof response.data === 'string' ? response.data : null);

      if (qrCode) {
        setSelectedDevice((prev: any) => ({ ...prev, SOMQR: qrCode }));
      } else {
        console.warn('QR code not found in response data');
      }
    } catch (error: any) {
      console.error('Failed to fetch QR code. Detailed Error:', error);
      toast({
        title: 'خطأ',
        description: error.message || 'فشل في جلب رمز QR',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingQR(false);
    }
  };

  const handleDelete = async (user: string) => {
    // if (!token) return; // Token might not be needed for stopSession based on API definition, but kept for consistency if needed or removed
    if (!confirm('هل أنت متأكد من حذف هذا الجهاز؟')) return;

  const handleDelete = async () => {
    if (!token || !selectedDevice) return;
    setIsSubmitting(true);
    try {
      } else {
        throw new Error(response.message || 'Failed to stop session');
      }
    } catch (error: any) {
      console.error('Stop Session Error:', error);
>>>>>>> 9da9d54a7bae81222417c430103aebdf5f1ab22b
      toast({
        title: 'فشل الحذف',
        description: error.message || 'حدث خطأ غير متوقع',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };
    setSelectedDevice(device);
    setEditData({
      name: device.SOMNA || device.user_name || device.customer_name || '',
      detail: '',
      phone: device.session_id || '',
    });
    setShowEditModal(true);
  };

  const handleUpdate = async () => {
    if (!token || !selectedDevice) return;
    setIsSubmitting(true);
    try {
      await updateUser(String(selectedDevice.session_id || selectedDevice.user_code), editData, token);
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
      description: `إعادة تشغيل جلسة ${device.SOMNA || device.customer_name || device.session_id}...`,
    });

    try {
      const userId = String(device.session_id || device.user_code);
      const response = await restartSession(userId);
      console.log('Restart Session Response:', response);

      if (response.status || response.message) {
        toast({
          title: 'تمت إعادة التشغيل',
          description: response.message || 'تم إعادة تشغيل الجلسة بنجاح',
          variant: 'default', // Success
        });
        // Invalidate queries to refresh the list and show new status
        queryClient.invalidateQueries({ queryKey: ['users-full'] });
      } else {
        throw new Error(response.message || 'Failed to restart session');
      }

    } catch (error: any) {
      console.error('Restart Session Error:', error);
      toast({
        title: 'فشل إعادة التشغيل',
        description: error.message || 'حدث خطأ أثناء إعادة تشغيل الجلسة',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteSession = (device: any) => {
    toast({
      title: 'تأكيد الحذف',
      description: `هل أنت متأكد من حذف ${device.SOMNA || device.customer_name || device.session_id}؟`,
      variant: 'destructive',
    });
  };

  if (isLoading) {
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
          <h1 className="text-xl lg:text-2xl font-bold text-foreground">
            الأجهزة {orgFilter && <span className="text-primary font-normal"> - {orgFilter}</span>}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">إدارة أجهزة واتساب والجلسات</p>
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
        {orgFilter && (
          <Button
            variant="ghost"
            className="gap-2 text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={() => navigate('/dashboard/users')}
          >
            <X className="w-4 h-4" />
            إلغاء تصفية المنظمة
          </Button>
        )}
        <Button variant="outline" className="gap-2">
          <Filter className="w-4 h-4" />
          تصفية
        </Button>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="data-table hidden lg:block"
      >
        <table className="w-full">
          <thead>
            <tr>
              <th className="text-xs">Session ID</th>
              <th className="text-xs">رمز المستخدم</th>
              <th className="text-xs">رقم العميل</th>
              <th className="text-xs">اسم الجهاز</th>
              <th className="text-xs">السيرفر</th>
              <th className="text-xs">رمز السيرفر</th>
              <th className="text-xs">الحالة</th>
              <th className="text-xs whitespace-nowrap">اليوم (نص - مرفق)</th>
              <th className="text-xs whitespace-nowrap">الإجمالي (نص - مرفق)</th>
              <th className="text-xs">حد الرسائل</th>
              <th className="text-xs">آخر ظهور</th>
              <th className="text-xs">إجراءات</th>
            </tr>
          </thead>
          <tbody>
            {paginatedDevices.map((device, index) => (
              <motion.tr
                key={device.session_id + (device.user_code || index)}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <td className="font-mono text-[11px]">{device.session_id}</td>
                <td className="text-[11px]">{device.user_code}</td>
                <td className="text-[11px] font-mono text-muted-foreground">{device.customer_number}</td>
                <td>
                  <div className="flex flex-col">
                    <span className="font-semibold text-foreground text-sm">{device.SOMNA || device.user_name || 'بدون اسم'}</span>
                    <span className="text-[10px] text-muted-foreground">{device.customer_name}</span>
                  </div>
                </td>
                <td>
                  <span className="text-[11px]">{device.server_name}</span>
                </td>
                <td className="text-[11px] font-mono text-primary">{device.server_code}</td>
                <td>
                  <SessionStatus status={device.status} />
                </td>
                <td>
                  <div className="flex flex-col text-[11px]">
                    <span className="text-success font-medium">{device.today_messages}</span>
                    <span className="text-[10px] text-muted-foreground">({device.today_text} - {device.today_attachments})</span>
                  </div>
                </td>
                <td>
                  <div className="flex flex-col text-[11px]">
                    <span className="font-medium">{device.total_messages}</span>
                    <span className="text-[10px] text-muted-foreground">({device.total_text} - {device.total_attachments})</span>
                  </div>
                </td>
                <td className="text-[11px] font-medium text-blue-600">{device.daily_limit}</td>
                <td className="text-[10px] text-muted-foreground whitespace-pre-wrap">
                  {device.last_message_date ? new Date(device.last_message_date).toLocaleString('ar-YE') : '-'}
                </td>
                <td>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleShowQR(device)}
                      title="عرض QR"
                    >
                      <QrCode className="w-4 h-4 text-primary" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleRestartSession(device)}
                      title="إعادة تشغيل"
                    >
                      <RefreshCw className="w-4 h-4 text-success" />
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-40 text-right">
                        <DropdownMenuItem
                          className="gap-2 justify-end"
                          onClick={() => handleEdit(device)}
                        >
                          تعديل
                          <History className="w-4 h-4" />
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="gap-2 text-destructive justify-end"
                          onClick={() => handleDelete(String(device.session_id || device.user_code))}
                        >
                          حذف
                          <Trash2 className="w-4 h-4" />
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </td>
              </motion.tr>
            ))}
          </tbody>
          </table>
        </div>

        {paginatedDevices.length === 0 && (
          <div className="p-12 text-center">
            <Smartphone className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground">لم يتم العثور على جلسات مطابقة للمعايير</p>
          </div>
        )}
      </motion.div>

      <div className="lg:hidden space-y-3">
        {paginatedDevices.map((device, index) => (
          <motion.div
            key={device.session_id + (device.user_code || index)}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="bg-card rounded-xl border border-border p-4 space-y-3"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center relative">
                  <Smartphone className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">{device.SOMNA || device.user_name || 'جهاز بدون اسم'}</p>
                  <p className="text-[10px] text-muted-foreground">{device.customer_name}</p>
                  <p className="text-xs text-muted-foreground font-mono mt-0.5" dir="ltr">{device.session_id}</p>
                </div>
              </div>
              <SessionStatus status={device.status} />
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px] border-t border-border pt-3">
              <div className="space-y-1">
                <p className="text-muted-foreground">اليوم</p>
                <div className="flex flex-col">
                  <span className="font-medium text-success">{device.today_messages}</span>
                  <span className="text-[9px] text-muted-foreground">({device.today_text} - {device.today_attachments})</span>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-muted-foreground">الإجمالي</p>
                <div className="flex flex-col">
                  <span className="font-medium">{device.total_messages}</span>
                  <span className="text-[9px] text-muted-foreground">({device.total_text} - {device.total_attachments})</span>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-muted-foreground">السيرفر</p>
                <p className="font-medium truncate">{device.server_name}</p>
                <p className="text-[9px] text-primary">{device.server_code}</p>
              </div>
              <div className="space-y-1">
                <p className="text-muted-foreground">رقم العميل</p>
                <p className="font-medium">{device.customer_number}</p>
                <p className="text-[9px] text-muted-foreground">Code: {device.user_code}</p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 pt-2 border-t border-border">
              <Button
                variant="outline"
                size="sm"
                className="flex-1 gap-2"
                onClick={() => handleShowQR(device)}
              >
                <QrCode className="w-4 h-4 text-primary" />
                QR
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex-1 gap-2"
                onClick={() => handleRestartSession(device)}
              >
                <RefreshCw className="w-4 h-4 text-success" />
                إعادة تشغيل
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon" className="h-8 w-8">
                    <MoreHorizontal className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-40 text-right">
                  <DropdownMenuItem
                    className="gap-2 justify-end"
                    onClick={() => handleEdit(device)}
                  >
                    تعديل
                    <History className="w-4 h-4" />
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="gap-2 text-destructive"
                    onClick={() => handleDelete(String(device.session_id || device.user_code))}
                  >
                    <Trash2 className="w-4 h-4" />
                    حذف
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </motion.div>
        ))}

        {filteredDevices.length === 0 && (
          <div className="p-12 text-center bg-card rounded-xl border border-border">
            <Smartphone className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground">لا توجد أجهزة</p>
          </div>
        )}
      </div>

      {/* Pagination */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4 border-t">
        <div className="flex items-center gap-4">
          <p className="text-sm text-muted-foreground">
            عرض {paginatedDevices.length} من {filteredDevices.length} جهاز
          </p>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">عرض:</span>
            <select
              className="text-xs bg-muted border rounded p-1"
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
            >
              <option value={20}>20 جلسة</option>
              <option value={50}>50 جلسة</option>
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
            السابق
          </Button>
          <div className="flex items-center gap-1">
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              // Simple pagination logic to show current +/- 2 pages
              let pageNum = i + 1;
              if (totalPages > 5 && currentPage > 3) {
                pageNum = currentPage - 3 + pageNum;
                if (pageNum > totalPages) pageNum = totalPages - (5 - i - 1);
              }

              return (
                <Button
                  key={pageNum}
                  variant={currentPage === pageNum ? 'default' : 'outline'}
                  size="sm"
                  className="w-8 h-8 p-0"
                  onClick={() => setCurrentPage(pageNum)}
                >
                  {pageNum}
                </Button>
              );
            })}
          </div>
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage === totalPages}
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
                  تحديث معلومات الجهاز: {selectedDevice?.SOMNA || selectedDevice?.customer_name}
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
