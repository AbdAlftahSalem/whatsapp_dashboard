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
} from 'lucide-react';
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
import type { WA_Device } from '@/types';

// Mock data
const mockDevices: WA_Device[] = [
  { id: 1, user: 'USR001', name: 'جهاز المبيعات 1', phone: '+966501234567', connectStatue: 'authenticated', active: true, userActive: true, messageSuccess: 1520, messageSendNo: 1600, createAt: '2024-01-15', orgName: 'شركة الأمل' },
  { id: 2, user: 'USR002', name: 'دعم العملاء', phone: '+966507654321', connectStatue: 'connecting', active: true, userActive: true, messageSuccess: 890, messageSendNo: 920, createAt: '2024-02-20', orgName: 'مؤسسة النور' },
  { id: 3, user: 'USR003', name: 'التسويق', phone: '+966509876543', connectStatue: 'close', active: true, userActive: false, messageSuccess: 0, messageSendNo: 0, createAt: '2024-03-10', orgName: 'شركة الرياض' },
  { id: 4, user: 'USR004', name: 'المبيعات الخارجية', phone: '+966502345678', connectStatue: 'authenticated', active: true, userActive: true, messageSuccess: 2340, messageSendNo: 2400, createAt: '2024-01-25', orgName: 'مجموعة الفجر' },
  { id: 5, user: 'USR005', name: 'خدمة ما بعد البيع', phone: '+966503456789', connectStatue: 'open', active: true, userActive: true, messageSuccess: 450, messageSendNo: 480, createAt: '2024-04-05', orgName: 'شركة الخليج' },
];

export default function UsersPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [devices] = useState<WA_Device[]>(mockDevices);
  const [selectedDevice, setSelectedDevice] = useState<WA_Device | null>(null);
  const [showQRModal, setShowQRModal] = useState(false);
  const [isLoadingQR, setIsLoadingQR] = useState(false);
  const { toast } = useToast();

  const filteredDevices = devices.filter(
    (device) =>
      device.name.includes(searchQuery) ||
      device.phone.includes(searchQuery) ||
      device.orgName?.includes(searchQuery)
  );

  const handleShowQR = async (device: WA_Device) => {
    setSelectedDevice(device);
    setShowQRModal(true);
    setIsLoadingQR(true);
    
    // Simulate loading QR
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsLoadingQR(false);
  };

  const handleRestartSession = async (device: WA_Device) => {
    toast({
      title: 'جاري إعادة تشغيل الجلسة',
      description: `إعادة تشغيل جلسة ${device.name}...`,
    });
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    toast({
      title: 'تمت إعادة التشغيل',
      description: 'تم إعادة تشغيل الجلسة بنجاح',
    });
  };

  const handleDeleteSession = (device: WA_Device) => {
    toast({
      title: 'تأكيد الحذف',
      description: `هل أنت متأكد من حذف ${device.name}؟`,
      variant: 'destructive',
    });
  };

  const getSuccessRate = (device: WA_Device) => {
    if (device.messageSendNo === 0) return 0;
    return ((device.messageSuccess / device.messageSendNo) * 100).toFixed(1);
  };

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
              <th>نسبة النجاح</th>
              <th>الإجراءات</th>
            </tr>
          </thead>
          <tbody>
            {filteredDevices.map((device, index) => (
              <motion.tr
                key={device.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <td>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center relative">
                      <Smartphone className="w-5 h-5 text-primary" />
                      {device.connectStatue === 'authenticated' && (
                        <span className="absolute -bottom-0.5 -left-0.5 w-3 h-3 rounded-full bg-success border-2 border-card" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{device.name}</p>
                      <p className="text-xs text-muted-foreground">{device.user}</p>
                    </div>
                  </div>
                </td>
                <td className="text-muted-foreground font-mono text-sm" dir="ltr">
                  {device.phone}
                </td>
                <td className="text-muted-foreground">{device.orgName}</td>
                <td>
                  <StatusBadge status={device.connectStatue} />
                </td>
                <td>
                  <div className="flex items-center gap-2">
                    <div className="w-20 h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-success rounded-full transition-all"
                        style={{ width: `${getSuccessRate(device)}%` }}
                      />
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {getSuccessRate(device)}%
                    </span>
                  </div>
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
            key={device.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="bg-card rounded-xl border border-border p-4 space-y-3"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center relative">
                  <Smartphone className="w-5 h-5 text-primary" />
                  {device.connectStatue === 'authenticated' && (
                    <span className="absolute -bottom-0.5 -left-0.5 w-3 h-3 rounded-full bg-success border-2 border-card" />
                  )}
                </div>
                <div>
                  <p className="font-medium text-foreground">{device.name}</p>
                  <p className="text-xs text-muted-foreground font-mono" dir="ltr">{device.phone}</p>
                </div>
              </div>
              <StatusBadge status={device.connectStatue} />
            </div>

            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Building2 className="w-4 h-4" />
              <span>{device.orgName}</span>
            </div>

            {/* Success Rate */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">نسبة النجاح</span>
                <span className="font-medium">{getSuccessRate(device)}%</span>
              </div>
              <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-success rounded-full transition-all"
                  style={{ width: `${getSuccessRate(device)}%` }}
                />
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
                  رمز QR - {selectedDevice.name}
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
                    {/* Placeholder QR - replace with actual QR */}
                    <div className="w-full h-full bg-gradient-to-br from-foreground/10 to-foreground/5 rounded-lg flex items-center justify-center">
                      <QrCode className="w-24 h-24 text-foreground/20" />
                    </div>
                  </motion.div>
                )}
                <p className="text-sm text-muted-foreground mt-4 text-center">
                  امسح هذا الرمز باستخدام تطبيق واتساب
                </p>
                <p className="text-xs text-muted-foreground mt-2 font-mono" dir="ltr">
                  {selectedDevice.phone}
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
