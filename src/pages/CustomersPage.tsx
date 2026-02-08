import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Building2,
  Plus,
  Search,
  MoreHorizontal,
  Edit2,
  Trash2,
  Phone,
  Mail,
  Loader2,
  XCircle,
  Calendar,
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
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getCustomers, deleteCustomer, updateCustomer } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

export default function CustomersPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editData, setEditData] = useState({ 
    name: '', 
    phone: '', 
    address: '',
    cinu: 1,
    citd: '' 
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { toast } = useToast();
  const { accessToken: token } = useAuthStore();
  const queryClient = useQueryClient();

  const { data: customersData, isLoading, error } = useQuery({
    queryKey: ['customers'],
    queryFn: getCustomers,
  });

  const handleEdit = (customer: any) => {
    setSelectedCustomer(customer);
    setEditData({
      name: customer.CINA || '',
      phone: customer.CIPH1 || '',
      address: customer.CIADD || '',
      cinu: customer.CINU || 1,
      citd: customer.CITD ? customer.CITD.split('T')[0] : '',
    });
    setShowEditModal(true);
  };

  const handleUpdate = async () => {
    if (!token || !selectedCustomer) return;
    setIsSubmitting(true);
    try {
      await updateCustomer(selectedCustomer.CIORG, editData, token);
      toast({
        title: 'تم التحديث بنجاح',
        description: 'تم تحديث بيانات المنظمة بنجاح',
      });
      setShowEditModal(false);
      queryClient.invalidateQueries({ queryKey: ['customers'] });
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

  const handleDelete = async (org: string) => {
    if (!token) return;
    if (!confirm('هل أنت متأكد من حذف هذا العميل؟ سيتم حذف جميع الأجهزة المرتبطة به.')) return;

    try {
      await deleteCustomer(org, token);
      toast({
        title: 'تم الحذف بنجاح',
        description: `تم حذف المنظمة ${org} بنجاح`,
      });
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    } catch (error) {
      toast({
        title: 'فشل الحذف',
        description: error instanceof Error ? error.message : 'حدث خطأ غير متوقع',
        variant: 'destructive',
      });
    }
  };

  const customers = customersData?.data.customers || [];

  const filteredCustomers = customers.filter(
    (customer) =>
      (customer.CINA && customer.CINA.includes(searchQuery)) ||
      (customer.CIEM && customer.CIEM.includes(searchQuery)) ||
      (customer.CIPH1 && customer.CIPH1.includes(searchQuery)) ||
      (customer.CIORG && customer.CIORG.includes(searchQuery))
  );

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
        <p className="text-muted-foreground animate-pulse">جاري تحميل بيانات العملاء...</p>
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
          <h3 className="text-lg font-semibold text-foreground">فشل تحميل بيانات العملاء</h3>
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
          <h1 className="text-xl lg:text-2xl font-bold text-foreground">العملاء</h1>
          <p className="text-sm text-muted-foreground mt-1">إدارة المنظمات والاشتراكات</p>
        </div>
        <Link to="/dashboard/customers/add">
          <Button className="gap-2 w-full sm:w-auto">
            <Plus className="w-4 h-4" />
            إضافة عميل
          </Button>
        </Link>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="البحث بالاسم أو البريد أو الهاتف..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pr-10"
          />
        </div>
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
              <th>المنظمة</th>
              <th>البريد الإلكتروني</th>
              <th>الهاتف</th>
              <th>عدد الأجهزة</th>
              <th>تاريخ الانتهاء</th>
              <th>الحالة</th>
              <th>الإجراءات</th>
            </tr>
          </thead>
          <tbody>
            {filteredCustomers.map((customer, index) => (
              <motion.tr
                key={customer.CISEQ}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <td>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Building2 className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{customer.CINA || customer.CINE || 'بدون اسم'}</p>
                      <p className="text-xs text-muted-foreground">{customer.CIORG}</p>
                    </div>
                  </div>
                </td>
                <td className="text-muted-foreground" dir="ltr">{customer.CIEM || '-'}</td>
                <td className="text-muted-foreground" dir="ltr">{customer.CIPH1 || '-'}</td>
                <td>
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-muted text-sm font-medium">
                    {customer.CINU} جهاز
                  </span>
                </td>
                <td>
                  <div className="flex items-center gap-2 text-muted-foreground text-sm">
                    <Calendar className="w-4 h-4" />
                    {customer.CITD ? new Date(customer.CITD).toLocaleDateString('ar-YE') : '-'}
                  </div>
                </td>
                <td>
                  <StatusBadge status={customer.CIST === 1 ? 'active' : 'inactive'} />
                </td>
                <td>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-40">
                      <DropdownMenuItem 
                        className="gap-2"
                        onClick={() => handleEdit(customer)}
                      >
                        <Edit2 className="w-4 h-4" />
                        تعديل
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        className="gap-2 text-destructive"
                        onClick={() => handleDelete(customer.CIORG)}
                      >
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

        {filteredCustomers.length === 0 && (
          <div className="p-12 text-center">
            <Building2 className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium text-foreground">لا يوجد عملاء</h3>
            <p className="text-muted-foreground mt-1">
              {searchQuery ? 'لا توجد نتائج تطابق بحثك' : 'ابدأ بإضافة أول عميل للنظام'}
            </p>
          </div>
        )}
      </motion.div>

      {/* Edit Customer Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="sm:max-w-md text-right" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-right">تعديل بيانات المنظمة</DialogTitle>
            <DialogDescription className="text-right">
              تحديث معلومات: {selectedCustomer?.CIORG}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2 text-right">
              <Label htmlFor="cust-name">اسم المنظمة</Label>
              <Input
                id="cust-name"
                value={editData.name}
                onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                placeholder="اسم العميل أو المنظمة"
              />
            </div>
            <div className="space-y-2 text-right">
              <Label htmlFor="cust-phone">رقم الهاتف</Label>
              <Input
                id="cust-phone"
                value={editData.phone}
                onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
                placeholder="رقم الهاتف"
                dir="ltr"
              />
            </div>
            <div className="space-y-2 text-right">
              <Label htmlFor="cust-address">العنوان</Label>
              <Input
                id="cust-address"
                value={editData.address}
                onChange={(e) => setEditData({ ...editData, address: e.target.value })}
                placeholder="العنوان"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2 text-right">
                <Label htmlFor="cust-cinu">الأجهزة المسموحة</Label>
                <Input
                  id="cust-cinu"
                  type="number"
                  min="1"
                  value={editData.cinu}
                  onChange={(e) => setEditData({ ...editData, cinu: parseInt(e.target.value) || 1 })}
                />
              </div>
              <div className="space-y-2 text-right">
                <Label htmlFor="cust-citd">تاريخ الانتهاء</Label>
                <Input
                  id="cust-citd"
                  type="date"
                  value={editData.citd}
                  onChange={(e) => setEditData({ ...editData, citd: e.target.value })}
                />
              </div>
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

      {/* Mobile Cards */}
      <div className="lg:hidden space-y-3">
        {filteredCustomers.map((customer, index) => (
          <motion.div
            key={customer.CISEQ}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="bg-card rounded-xl border border-border p-4 space-y-3"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-foreground">{customer.CINA || customer.CINE || 'بدون اسم'}</p>
                  <p className="text-xs text-muted-foreground">{customer.CIORG}</p>
                </div>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreHorizontal className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-40">
                   <DropdownMenuItem 
                    className="gap-2"
                    onClick={() => handleEdit(customer)}
                  >
                    <Edit2 className="w-4 h-4" />
                    تعديل
                  </DropdownMenuItem>
                  <DropdownMenuItem className="gap-2 text-destructive">
                    <Trash2 className="w-4 h-4" />
                    حذف
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Mail className="w-4 h-4" />
                <span dir="ltr" className="truncate">{customer.CIEM || '-'}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Phone className="w-4 h-4" />
                <span dir="ltr">{customer.CIPH1 || '-'}</span>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-border">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-muted text-xs font-medium">
                  {customer.CINU} جهاز
                </span>
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Calendar className="w-3 h-3" />
                  {customer.CITD ? new Date(customer.CITD).toLocaleDateString('ar-YE') : '-'}
                </span>
              </div>
              <StatusBadge status={customer.CIST === 1 ? 'active' : 'inactive'} />
            </div>
          </motion.div>
        ))}

        {filteredCustomers.length === 0 && (
          <div className="p-12 text-center bg-card rounded-xl border border-border">
            <Building2 className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground">لا توجد نتائج</p>
          </div>
        )}
      </div>

      {/* Pagination */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground">
          عرض {filteredCustomers.length} من {customers.length} عميل
        </p>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" disabled>
            السابق
          </Button>
          <Button variant="outline" size="sm" className="bg-primary text-primary-foreground">
            1
          </Button>
          <Button variant="outline" size="sm" disabled>
            التالي
          </Button>
        </div>
      </div>
    </div>
  );
}
