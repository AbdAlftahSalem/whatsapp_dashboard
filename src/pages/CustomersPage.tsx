import { useState, useEffect } from 'react';
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
  Smartphone,
  Filter,
  ArrowUpDown,
  ChevronDown,
  FileDown,
  ChevronLeft,
  ChevronRight,
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
    detail: '',
    email: '',
    phone: '',
    branch: '',
    dlm: 0,
    country: 'YE',
    lan: 'ar',
    system: '',
    address: '',
    cinu: 1,
    citd: '',
    af2: '',
    af3: '',
    af4: '',
    af5: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter & Sort States
  const [filters, setFilters] = useState({
    status: 'all',
    dateFrom: '',
    dateTo: '',
    ciidFrom: '',
    ciidTo: '',
  });
  const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' }>({
    key: 'CISEQ',
    direction: 'desc'
  });
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

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
      detail: customer.CIDE || '',
      email: customer.CIEM || '',
      phone: customer.CIPH1 || '',
      branch: customer.CIAF1 || '',
      dlm: customer.CIDLM || 0,
      country: customer.CUCA || 'YE',
      lan: customer.CILAN || 'ar',
      system: customer.CIAF10 || '',
      address: customer.CIADD || '',
      cinu: customer.CINU || 1,
      citd: customer.CITD ? customer.CITD.split('T')[0] : '',
      af2: customer.CIAF2 || '',
      af3: customer.CIAF3 || '',
      af4: customer.CIAF4 || '',
      af5: customer.CIAF5 || '',
    });
    setShowEditModal(true);
  };

  const handleUpdate = async () => {
    if (!token || !selectedCustomer) return;
    setIsSubmitting(true);
    try {
      // Map the user-friendly state back to API keys
      const updateData = {
        name: editData.name,
        detail: editData.detail,
        email: editData.email,
        phone: editData.phone,
        address: editData.address,
        country: editData.country,
        lan: editData.lan,
        cinu: editData.cinu,
        citd: editData.citd,
        // Added AF fields mapping
        af1: editData.branch,
        af10: editData.system,
        dlm: editData.dlm,
        af2: editData.af2,
        af3: editData.af3,
        af4: editData.af4,
        af5: editData.af5,
      };

      await updateCFustomer(selectedCustomer.CIORG, updateData, token);

      toast({
        title: 'تم التحديث بنجاح',
        description: 'تم تحديث بيانات العميل بنجاح',
      });

      setShowEditModal(false);
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    } catch (error) {
      console.error('Update error:', error);
      toast({
        title: 'فشل التحديث',
        description: error instanceof Error ? error.message : 'حدث خطأ أثناء الاتصال بالسيرفر',
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

  const handleSort = (key: string) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'desc' ? 'asc' : 'desc'
    }));
  };

  const applyQuickDate = (period: 'today' | 'week' | 'month') => {
    const now = new Date();
    let from = new Date();
    if (period === 'today') from.setHours(0, 0, 0, 0);
    else if (period === 'week') from.setDate(now.getDate() - 7);
    else if (period === 'month') from.setMonth(now.getMonth() - 1);

    setFilters(prev => ({
      ...prev,
      dateFrom: from.toISOString().split('T')[0],
      dateTo: now.toISOString().split('T')[0]
    }));
  };

  const filteredCustomers = customers.filter((customer) => {
    // Text Search
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = !searchQuery ||
      (customer.CINA && customer.CINA.toLowerCase().includes(searchLower)) ||
      (customer.CIPH1 && customer.CIPH1.includes(searchQuery)) ||
      (customer.CIAF1 && customer.CIAF1.toLowerCase().includes(searchLower)) ||
      (customer.CIID && customer.CIID.includes(searchQuery));

    // Status Filter
    const matchesStatus = filters.status === 'all' ||
      (filters.status === 'active' && customer.CIST === 1) ||
      (filters.status === 'inactive' && customer.CIST !== 1);

    // Date Filter (Registration Date - DATEI)
    const regDate = customer.DATEI ? new Date(customer.DATEI).getTime() : 0;
    const matchesDateFrom = !filters.dateFrom || regDate >= new Date(filters.dateFrom).getTime();
    const matchesDateTo = !filters.dateTo || regDate <= new Date(filters.dateTo).setHours(23, 59, 59, 999);

    // General Number Filter (CIID)
    const ciid = parseInt(customer.CIID) || 0;
    const fromCiid = parseInt(filters.ciidFrom) || 0;
    const toCiid = parseInt(filters.ciidTo) || Infinity;
    const matchesCiid = (!filters.ciidFrom || ciid >= fromCiid) && (!filters.ciidTo || ciid <= toCiid);

    return matchesSearch && matchesStatus && matchesDateFrom && matchesDateTo && matchesCiid;
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

  const handleExport = () => {
    if (filteredCustomers.length === 0) return;

    const headers = ["معرف العميل", "الرقم العام", "الفرع", "اسم العميل", "الهاتف", "تاريخ الإضافة", "الحالة", "الأجهزة", "حد الرسائل"];
    const rows = filteredCustomers.map(c => [
      c.CISEQ,
      c.CIID || '',
      c.CIAF1 || 'الرئيسي',
      c.CINA || '',
      c.CIPH1 || '',
      c.DATEI ? new Date(c.DATEI).toLocaleDateString('ar-YE') : '',
      c.CIST === 1 ? 'فعال' : 'موقوف',
      c.CINU,
      c.CIDLM
    ]);

    const csvContent = "\uFEFF" + [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `customers_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "تم التصدير بنجاح",
      description: "تم تصدير البيانات إلى ملف CSV"
    });
  };

  const totalPages = Math.ceil(filteredCustomers.length / pageSize);
  const paginatedCustomers = filteredCustomers.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filters]);

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

      {/* Search & Advanced Filters */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="البحث بالاسم، الهاتف، الفرع أو الرقم العام..."
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
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                value={filters.status}
                onChange={(e) => {
                  setFilters(prev => ({ ...prev, status: e.target.value }));
                  setCurrentPage(1);
                }}
              >
                <option value="all">الكل</option>
                <option value="active">فعال</option>
                <option value="inactive">موقوف</option>
              </select>
            </div>

            {/* General Number Range */}
            <div className="space-y-2">
              <Label>الرقم العام (CIID)</Label>
              <div className="flex items-center gap-2">
                <Input
                  placeholder="من"
                  value={filters.ciidFrom}
                  onChange={(e) => {
                    setFilters(prev => ({ ...prev, ciidFrom: e.target.value }));
                    setCurrentPage(1);
                  }}
                />
                <Input
                  placeholder="إلى"
                  value={filters.ciidTo}
                  onChange={(e) => {
                    setFilters(prev => ({ ...prev, ciidTo: e.target.value }));
                    setCurrentPage(1);
                  }}
                />
              </div>
            </div>

            {/* Date Filter */}
            <div className="space-y-2 lg:col-span-2">
              <div className="flex items-center justify-between">
                <Label>تاريخ الإضافة</Label>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="xs" onClick={() => { applyQuickDate('today'); setCurrentPage(1); }} className="text-[10px] h-6">اليوم</Button>
                  <Button variant="ghost" size="xs" onClick={() => { applyQuickDate('week'); setCurrentPage(1); }} className="text-[10px] h-6">أسبوع</Button>
                  <Button variant="ghost" size="xs" onClick={() => { applyQuickDate('month'); setCurrentPage(1); }} className="text-[10px] h-6">شهر</Button>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Input
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) => {
                    setFilters(prev => ({ ...prev, dateFrom: e.target.value }));
                    setCurrentPage(1);
                  }}
                />
                <Input
                  type="date"
                  value={filters.dateTo}
                  onChange={(e) => {
                    setFilters(prev => ({ ...prev, dateTo: e.target.value }));
                    setCurrentPage(1);
                  }}
                />
              </div>
            </div>

            <div className="lg:col-span-4 flex justify-between items-center border-t pt-4">
              <Button
                variant="outline"
                size="sm"
                className="gap-2 text-primary"
                onClick={handleExport}
              >
                <FileDown className="w-4 h-4" />
                تصدير البيانات (CSV)
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setFilters({ status: 'all', dateFrom: '', dateTo: '', ciidFrom: '', ciidTo: '' });
                  setSearchQuery('');
                  setCurrentPage(1);
                }}
              >
                إعادة ضبط التصفية
              </Button>
            </div>
          </motion.div>
        )}
      </div>

      {/* Desktop Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="data-table"
      >
        <div className="overflow-x-auto">
          <table className="w-full whitespace-nowrap">
            <thead>
              <tr>
                <th className="min-w-[80px] cursor-pointer hover:bg-muted" onClick={() => handleSort('CISEQ')}>
                  <div className="flex items-center gap-1">معرف العميل <ArrowUpDown className="w-3 h-3" /></div>
                </th>
                <th className="min-w-[120px] cursor-pointer hover:bg-muted" onClick={() => handleSort('CIID')}>
                  <div className="flex items-center gap-1">الرقم العام <ArrowUpDown className="w-3 h-3" /></div>
                </th>
                <th className="min-w-[100px] cursor-pointer hover:bg-muted" onClick={() => handleSort('CIAF1')}>
                  <div className="flex items-center gap-1">الفرع <ArrowUpDown className="w-3 h-3" /></div>
                </th>
                <th className="min-w-[180px] cursor-pointer hover:bg-muted" onClick={() => handleSort('CINA')}>
                  <div className="flex items-center gap-1">اسم العميل <ArrowUpDown className="w-3 h-3" /></div>
                </th>
                <th className="min-w-[120px]">رقم الهاتف</th>
                <th className="min-w-[120px] cursor-pointer hover:bg-muted" onClick={() => handleSort('DATEI')}>
                  <div className="flex items-center gap-1">تاريخ الإضافة <ArrowUpDown className="w-3 h-3" /></div>
                </th>
                <th className="min-w-[150px] cursor-pointer hover:bg-muted" onClick={() => handleSort('CIST')}>
                  <div className="flex items-center gap-1">الحالة <ArrowUpDown className="w-3 h-3" /></div>
                </th>
                <th className="min-w-[200px]">تاريخ التفعيل (من - إلى)</th>
                <th className="min-w-[100px] cursor-pointer hover:bg-muted" onClick={() => handleSort('CINU')}>
                  <div className="flex items-center gap-1">الأجهزة <ArrowUpDown className="w-3 h-3" /></div>
                </th>
                <th className="min-w-[100px]">حد الرسائل</th>
                <th className="min-w-[100px]">الجلسات الفعالة</th>
                <th className="min-w-[100px]">الرسائل المرسلة</th>
                <th className="min-w-[140px]">تاريخ آخر رسالة</th>
                <th className="min-w-[140px]">النظام والاصدار</th>
                <th className="min-w-[120px]">المسؤول</th>
                <th className="min-w-[120px]">CIORG</th>
                <th className="sticky left-0 bg-muted/50">الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {paginatedCustomers.map((customer, index) => (
                <motion.tr
                  key={customer.CISEQ}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <td className="font-mono text-xs">{customer.CISEQ}</td>
                  <td className="font-mono text-xs">{customer.CIID || '-'}</td>
                  <td>{customer.CIAF1 || 'الرئيسي'}</td>
                  <td>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <Building2 className="w-4 h-4 text-primary" />
                      </div>
                      <p className="font-medium text-foreground">{customer.CINA || customer.CINE || 'بدون اسم'}</p>
                    </div>
                  </td>
                  <td dir="ltr">{customer.CIPH1 || '-'}</td>
                  <td className="text-xs">
                    {customer.DATEI ? new Date(customer.DATEI).toLocaleDateString('ar-YE') : '-'}
                  </td>
                  <td>
                    <div className="flex flex-col gap-1">
                      <StatusBadge status={customer.CIST === 1 ? 'active' : 'inactive'} />
                      {customer.CIST !== 1 && customer.RES && (
                        <span className="text-[10px] text-destructive truncate max-w-[120px]" title={customer.RES}>
                          {customer.RES}
                        </span>
                      )}
                    </div>
                  </td>
                  <td>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground bg-muted/30 px-2 py-1 rounded-md">
                      <Calendar className="w-3 h-3" />
                      <span>{customer.CIFD ? new Date(customer.CIFD).toLocaleDateString('ar-YE') : '?'}</span>
                      <span className="mx-1">→</span>
                      <span>{customer.CITD ? new Date(customer.CITD).toLocaleDateString('ar-YE') : '?'}</span>
                    </div>
                  </td>
                  <td>
                    <span className="inline-flex items-center px-2 py-1 rounded-lg bg-muted text-xs font-medium">
                      {customer.CINU}
                    </span>
                  </td>
                  <td>
                    <span className="text-xs font-medium">{customer.CIDLM}</span>
                  </td>
                  <td>
                    <span className="text-xs font-medium text-success">{customer.CIAF7 || 0}</span>
                  </td>
                  <td>
                    <span className="text-xs font-medium">{customer.CIAF8 || 0}</span>
                  </td>
                  <td className="text-[10px]">
                    {customer.CIAF9 ? new Date(customer.CIAF9).toLocaleString('ar-YE') : '-'}
                  </td>
                  <td className="text-xs">{customer.CIAF10 || customer.DEVI || '-'}</td>
                  <td className="text-xs">{customer.CIMAN || '-'}</td>
                  <td className="font-mono text-[10px] text-muted-foreground">{customer.CIORG}</td>
                  <td className="sticky left-0 bg-background/95 backdrop-blur-sm border-r">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem
                          className="gap-2"
                          onClick={() => handleEdit(customer)}
                        >
                          <Edit2 className="w-4 h-4" />
                          تعديل
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="gap-2"
                          asChild
                        >
                          <Link to={`/dashboard/users?search=${customer.CIORG}`}>
                            <Smartphone className="w-4 h-4" />
                            عرض الجلسات
                          </Link>
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
        </div>

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
        <DialogContent className="sm:max-w-2xl text-right overflow-y-auto max-h-[90vh]" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-right flex items-center gap-2">
              <Edit2 className="w-5 h-5 text-primary" />
              تعديل بيانات المنظمة
            </DialogTitle>
            <DialogDescription className="text-right">
              الرقم العام: {selectedCustomer?.CIID} | المعرف التقني: {selectedCustomer?.CIORG}
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
            {/* Basic Info */}
            <div className="space-y-4 md:col-span-2 border-b pb-4">
              <h4 className="font-semibold text-sm text-primary">البيانات الأساسية</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2 text-right">
                  <Label htmlFor="edit-name">اسم المنظمة</Label>
                  <Input
                    id="edit-name"
                    value={editData.name}
                    onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2 text-right">
                  <Label htmlFor="edit-detail">التفاصيل / الملاحظات</Label>
                  <Input
                    id="edit-detail"
                    value={editData.detail}
                    onChange={(e) => setEditData({ ...editData, detail: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {/* Contact Info */}
            <div className="space-y-4 border-b md:border-b-0 pb-4 md:pb-0">
              <h4 className="font-semibold text-sm text-primary">الاتصال والموقع</h4>
              <div className="space-y-2 text-right">
                <Label htmlFor="edit-email">البريد الإلكتروني</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={editData.email}
                  onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                  dir="ltr"
                />
              </div>
              <div className="space-y-2 text-right">
                <Label htmlFor="edit-phone">رقم الهاتف</Label>
                <Input
                  id="edit-phone"
                  value={editData.phone}
                  onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
                  dir="ltr"
                />
              </div>
              <div className="space-y-2 text-right">
                <Label htmlFor="edit-address">العنوان</Label>
                <Input
                  id="edit-address"
                  value={editData.address}
                  onChange={(e) => setEditData({ ...editData, address: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-2 text-right">
                  <Label htmlFor="edit-country">الدولة</Label>
                  <Input
                    id="edit-country"
                    value={editData.country}
                    onChange={(e) => setEditData({ ...editData, country: e.target.value })}
                  />
                </div>
                <div className="space-y-2 text-right">
                  <Label htmlFor="edit-lan">اللغة</Label>
                  <select
                    id="edit-lan"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={editData.lan}
                    onChange={(e) => setEditData({ ...editData, lan: e.target.value })}
                  >
                    <option value="ar">العربية</option>
                    <option value="en">الإنجليزية</option>
                  </select>
                </div>
              </div>
            </div>

            {/* System Info */}
            <div className="space-y-4">
              <h4 className="font-semibold text-sm text-primary">إعدادات النظام</h4>
              <div className="space-y-2 text-right">
                <Label htmlFor="edit-branch">الفرع (AF1)</Label>
                <Input
                  id="edit-branch"
                  value={editData.branch}
                  onChange={(e) => setEditData({ ...editData, branch: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-2 text-right">
                  <Label htmlFor="edit-dlm">حد الرسائل اليومي</Label>
                  <Input
                    id="edit-dlm"
                    type="number"
                    value={editData.dlm}
                    onChange={(e) => setEditData({ ...editData, dlm: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-2 text-right">
                  <Label htmlFor="edit-cinu">الأجهزة المصرحة</Label>
                  <Input
                    id="edit-cinu"
                    type="number"
                    min="1"
                    value={editData.cinu}
                    onChange={(e) => setEditData({ ...editData, cinu: parseInt(e.target.value) || 1 })}
                  />
                </div>
              </div>
              <div className="space-y-2 text-right">
                <Label htmlFor="edit-system">النظام (AF10)</Label>
                <Input
                  id="edit-system"
                  value={editData.system}
                  onChange={(e) => setEditData({ ...editData, system: e.target.value })}
                />
              </div>
              <div className="space-y-2 text-right">
                <Label htmlFor="edit-citd">تاريخ انتهاء الاشتراك</Label>
                <Input
                  id="edit-citd"
                  type="date"
                  value={editData.citd}
                  onChange={(e) => setEditData({ ...editData, citd: e.target.value })}
                />
              </div>
            </div>

            {/* Extra Fields */}
            <div className="space-y-4 md:col-span-2 border-t pt-4">
              <h4 className="font-semibold text-sm text-muted-foreground">حقول إضافية</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                <Input placeholder="حقل 2" value={editData.af2} onChange={e => setEditData({ ...editData, af2: e.target.value })} />
                <Input placeholder="حقل 3" value={editData.af3} onChange={e => setEditData({ ...editData, af3: e.target.value })} />
                <Input placeholder="حقل 4" value={editData.af4} onChange={e => setEditData({ ...editData, af4: e.target.value })} />
                <Input placeholder="حقل 5" value={editData.af5} onChange={e => setEditData({ ...editData, af5: e.target.value })} />
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:justify-start pt-4 border-t">
            <Button variant="outline" onClick={() => setShowEditModal(false)}>
              إلغاء
            </Button>
            <Button onClick={handleUpdate} disabled={isSubmitting} className="min-w-[120px]">
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

            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Mail className="w-3 h-3" />
                <span dir="ltr" className="truncate">{customer.CIEM || '-'}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Phone className="w-3 h-3" />
                <span dir="ltr">{customer.CIPH1 || '-'}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Smartphone className="w-3 h-3" />
                <span>{customer.CINU} أجهزة</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="w-3 h-3" />
                <span>ينتهي: {customer.CITD ? new Date(customer.CITD).toLocaleDateString('ar-YE') : '-'}</span>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-border">
              <div className="flex flex-col gap-1">
                <p className="text-[10px] text-muted-foreground">الرقم العام: {customer.CIID || '-'}</p>
                <p className="text-[10px] text-muted-foreground">الفرع: {customer.CIAF1 || 'الرئيسي'}</p>
              </div>
              <div className="flex flex-col items-end gap-1">
                <StatusBadge status={customer.CIST === 1 ? 'active' : 'inactive'} />
                {customer.CIST !== 1 && customer.RES && (
                  <span className="text-[9px] text-destructive">{customer.RES}</span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-2 text-[10px] text-center border-t border-border">
              <div className="bg-muted px-1 py-1 rounded">
                <p className="text-muted-foreground">نشطة</p>
                <p className="font-bold">{customer.CIAF7 || 0}</p>
              </div>
              <div className="bg-muted px-1 py-1 rounded">
                <p className="text-muted-foreground">رسائل</p>
                <p className="font-bold">{customer.CIAF8 || 0}</p>
              </div>
              <div className="bg-muted px-1 py-1 rounded">
                <p className="text-muted-foreground">حد</p>
                <p className="font-bold">{customer.CIDLM}</p>
              </div>
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

      {/* Pagination & Export Footer */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-card p-4 rounded-xl border">
        <div className="flex items-center gap-4">
          <p className="text-sm text-muted-foreground whitespace-nowrap">
            عرض {paginatedCustomers.length} من {filteredCustomers.length} عميل
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
              {[10, 25, 50, 100].map(size => (
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
    </div>
  );
}
