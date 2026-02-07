import { useState } from 'react';
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
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { getAllUsers } from '@/lib/api';
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
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';

export default function UsersPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const { toast } = useToast();
  const [selectedDevice, setSelectedDevice] = useState<any>(null);
  const [showQRModal, setShowQRModal] = useState(false);
  const [isLoadingQR, setIsLoadingQR] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ['users'],
    queryFn: getAllUsers,
  });

  const devices = data?.data.Users || [];

  const mapStatus = (status: string): any => {
    switch (status) {
      case 'ready': return 'authenticated';
      case 'qr': return 'open';
      case 'none': return 'close';
      case 'logout': return 'close';
      default: return 'close';
    }
  };

  const filteredDevices = devices.filter(
    (device) =>
      (device.SOMNA && device.SOMNA.includes(searchQuery)) ||
      (device.SOMPH && device.SOMPH.includes(searchQuery)) ||
      (device.CIORG && device.CIORG.includes(searchQuery))
  );

  const handleShowQR = async (device: any) => {
    setSelectedDevice(device);
    setShowQRModal(true);
    setIsLoadingQR(true);
    
    // Simulate loading QR
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsLoadingQR(false);
  };

  const handleRestartSession = async (device: any) => {
    toast({
      title: 'جاري إعادة تشغيل الجلسة',
      description: `إعادة تشغيل جلسة ${device.SOMNA || device.SOMDE || device.USER}...`,
    });
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    toast({
      title: 'تمت إعادة التشغيل',
      description: 'تم إعادة تشغيل الجلسة بنجاح',
    });
  };

  const handleDeleteSession = (device: any) => {
    toast({
      title: 'تأكيد الحذف',
      description: `هل أنت متأكد من حذف ${device.SOMNA || device.SOMDE || device.USER}؟`,
      variant: 'destructive',
    });
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
        <p className="text-muted-foreground animate-pulse">جاري تحميل بيانات الأجهزة...</p>
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
          <h3 className="text-lg font-semibold text-foreground">فشل تحميل بيانات الأجهزة</h3>
          <p className="text-sm text-muted-foreground mt-1">يرجى التحقق من اتصالك بالخادم والمحاولة مرة أخرى</p>
        </div>
      </div>
    );
  }


  return (
    <div className="space-y-4 lg:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-foreground">الأجهزة</h1>
          <p className="text-sm text-muted-foreground mt-1">إدارة أجهزة واتساب والجلسات</p>
        </div>
        <Link to="/dashboard/users/add">
          <Button className="gap-2 w-full sm:w-auto">
            <Plus className="w-4 h-4" />
            إضافة جهاز
          </Button>
        </Link>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="البحث بالاسم أو الهاتف أو المنظمة..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pr-10"
          />
        </div>
        <Button variant="outline" className="gap-2">
          <Filter className="w-4 h-4" />
          تصفية
        </Button>
      </div>

      {/* Desktop Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="data-table hidden lg:block"
      >
        <table className="w-full">
          <thead>
            <tr>
              <th>الجهاز</th>
              <th>رقم الهاتف</th>
              <th>المنظمة</th>
              <th>الحالة</th>
              <th>الإجراءات</th>
            </tr>
          </thead>
          <tbody>
            {filteredDevices.map((device, index) => (
              <motion.tr
                key={device.SOMSEQ}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <td>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center relative">
                      <Smartphone className="w-5 h-5 text-primary" />
                      {mapStatus(device.SOMCST) === 'authenticated' && (
                        <span className="absolute -bottom-0.5 -left-0.5 w-3 h-3 rounded-full bg-success border-2 border-card" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{device.SOMNA || device.SOMDE || 'جهاز بدون اسم'}</p>
                      <p className="text-xs text-muted-foreground">{device.USER}</p>
                    </div>
                  </div>
                </td>
                <td className="text-muted-foreground font-mono text-sm" dir="ltr">
                  {device.SOMPH || '-'}
                </td>
                <td className="text-muted-foreground">{device.CIORG}</td>
                <td>
                  <StatusBadge status={mapStatus(device.SOMCST)} />
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
                      <QrCode className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleRestartSession(device)}
                      title="إعادة تشغيل"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-40">
                        <DropdownMenuItem
                          className="gap-2 text-destructive"
                          onClick={() => handleDeleteSession(device)}
                        >
                          <Trash2 className="w-4 h-4" />
                          حذف الجهاز
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>

        {filteredDevices.length === 0 && (
          <div className="p-12 text-center">
            <Smartphone className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground">لا توجد أجهزة</p>
          </div>
        )}
      </motion.div>

      {/* Mobile Cards */}
      <div className="lg:hidden space-y-3">
        {filteredDevices.map((device, index) => (
          <motion.div
            key={device.SOMSEQ}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="bg-card rounded-xl border border-border p-4 space-y-3"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center relative">
                  <Smartphone className="w-5 h-5 text-primary" />
                  {mapStatus(device.SOMCST) === 'authenticated' && (
                    <span className="absolute -bottom-0.5 -left-0.5 w-3 h-3 rounded-full bg-success border-2 border-card" />
                  )}
                </div>
                <div>
                  <p className="font-medium text-foreground">{device.SOMNA || device.SOMDE || 'جهاز بدون اسم'}</p>
                  <p className="text-xs text-muted-foreground font-mono" dir="ltr">{device.SOMPH || '-'}</p>
                </div>
              </div>
              <StatusBadge status={mapStatus(device.SOMCST)} />
            </div>

            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Building2 className="w-4 h-4" />
              <span>{device.CIORG}</span>
            </div>


            {/* Actions */}
            <div className="flex items-center gap-2 pt-2 border-t border-border">
              <Button
                variant="outline"
                size="sm"
                className="flex-1 gap-2"
                onClick={() => handleShowQR(device)}
              >
                <QrCode className="w-4 h-4" />
                QR
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex-1 gap-2"
                onClick={() => handleRestartSession(device)}
              >
                <RefreshCw className="w-4 h-4" />
                إعادة تشغيل
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon" className="h-8 w-8">
                    <MoreHorizontal className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-40">
                  <DropdownMenuItem
                    className="gap-2 text-destructive"
                    onClick={() => handleDeleteSession(device)}
                  >
                    <Trash2 className="w-4 h-4" />
                    حذف الجهاز
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
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground">
          عرض {filteredDevices.length} من {devices.length} جهاز
        </p>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" disabled>
            السابق
          </Button>
          <Button variant="outline" size="sm" className="bg-primary text-primary-foreground">
            1
          </Button>
          <Button variant="outline" size="sm">
            التالي
          </Button>
        </div>
      </div>

      {/* QR Code Modal */}
      <AnimatePresence>
        {showQRModal && selectedDevice && (
          <Dialog open={showQRModal} onOpenChange={setShowQRModal}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <QrCode className="w-5 h-5 text-primary" />
                  رمز QR - {selectedDevice.SOMNA || selectedDevice.SOMDE || selectedDevice.USER}
                </DialogTitle>
              </DialogHeader>
              <div className="flex flex-col items-center justify-center py-8">
                {isLoadingQR ? (
                  <div className="w-48 h-48 flex items-center justify-center bg-muted rounded-xl">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  </div>
                ) : (
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="w-48 h-48 bg-white rounded-xl p-4 shadow-lg"
                  >
                    {/* Display actual QR if available */}
                    {selectedDevice.SOMQR ? (
                      <img src={selectedDevice.SOMQR} alt="QR Code" className="w-full h-full object-contain" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-foreground/10 to-foreground/5 rounded-lg flex items-center justify-center">
                        <QrCode className="w-24 h-24 text-foreground/20" />
                      </div>
                    )}
                  </motion.div>
                )}
                <p className="text-sm text-muted-foreground mt-4 text-center">
                  امسح هذا الرمز باستخدام تطبيق واتساب
                </p>
                <p className="text-xs text-muted-foreground mt-2 font-mono" dir="ltr">
                  {selectedDevice.SOMPH || '-'}
                </p>
              </div>
              <div className="flex justify-end">
                <Button variant="outline" onClick={() => setShowQRModal(false)}>
                  <X className="w-4 h-4 ml-2" />
                  إغلاق
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </AnimatePresence>
    </div>
  );
}
