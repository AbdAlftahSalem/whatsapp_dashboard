import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Building2,
  Plus,
  Phone,
  Mail,
  Calendar,
  Smartphone,
  FileDown,
  ChevronLeft,
  Edit2,
  Trash2,
  MoreHorizontal,
  RefreshCw,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/DataTable';
import { SearchFilterBar } from '@/components/ui/SearchFilterBar';
import { PageLoader } from '@/components/ui/PageLoader';
import { PageError } from '@/components/ui/PageError';
import { StatsCard } from '@/components/ui/StatsCard';
import { MobileCard, MobileCardStat } from '@/components/ui/MobileCard';
import { Pagination } from '@/components/ui/Pagination';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { StatusFilter } from '@/components/filters/StatusFilter';
import { DateRangeFilter } from '@/components/filters/DateRangeFilter';
import { RangeFilter } from '@/components/filters/RangeFilter';
import { DeleteConfirmModal } from '@/components/ui/DeleteConfirmModal';
import { CustomerEditModal } from '@/features/customers/components/CustomerEditModal';
import { getCustomerColumns } from '@/features/customers/components/CustomerTableColumns';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getCustomers, deleteCustomer, updateCustomer } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import { useToast } from '@/hooks/use-toast';
import { usePagination } from '@/hooks/usePagination';
import { useSorting } from '@/hooks/useSorting';
import { useFiltering } from '@/hooks/useFiltering';
import { exportToCSV } from '@/lib/exportUtils';

export default function CustomersPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const initialFilters = {
    status: 'all',
    dateFrom: '',
    dateTo: '',
    ciidFrom: '',
    ciidTo: '',
  };

  const [filters, setFilters] = useState(initialFilters);

  const { toast } = useToast();
  const { accessToken: token } = useAuthStore();
  const queryClient = useQueryClient();

  const { data: customersData, isLoading, error, refetch } = useQuery({
    queryKey: ['customers'],
    queryFn: getCustomers,
  });

  const customers = customersData?.data.customers || [];

  // Filtering Logic
  const filterFn = (customer: any, filters: any) => {
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = !searchQuery ||
      (customer.CINA && customer.CINA.toLowerCase().includes(searchLower)) ||
      (customer.CIPH1 && customer.CIPH1.includes(searchQuery)) ||
      (customer.CIAF1 && customer.CIAF1.toLowerCase().includes(searchLower)) ||
      (customer.CIID && customer.CIID.includes(searchQuery));

    const matchesStatus = filters.status === 'all' ||
      (filters.status === 'active' && customer.CIST === 1) ||
      (filters.status === 'inactive' && customer.CIST !== 1);

    const regDate = customer.DATEI ? new Date(customer.DATEI).getTime() : 0;
    const matchesDateFrom = !filters.dateFrom || regDate >= new Date(filters.dateFrom).getTime();
    const matchesDateTo = !filters.dateTo || regDate <= new Date(filters.dateTo).setHours(23, 59, 59, 999);

    const ciid = parseInt(customer.CIID) || 0;
    const fromCiid = parseInt(filters.ciidFrom) || 0;
    const toCiid = parseInt(filters.ciidTo) || Infinity;
    const matchesCiid = (!filters.ciidFrom || ciid >= fromCiid) && (!filters.ciidTo || ciid <= toCiid);

    return matchesSearch && matchesStatus && matchesDateFrom && matchesDateTo && matchesCiid;
  };

  const filteredData = useFiltering({ data: customers, filters, filterFn });
  
  // Re-apply text search on top of useFiltering (since searchQuery is separate)
  const searchingData = useMemo(() => {
    if (!searchQuery) return filteredData;
    const searchLower = searchQuery.toLowerCase();
    return filteredData.filter(customer => 
      (customer.CINA && customer.CINA.toLowerCase().includes(searchLower)) ||
      (customer.CIPH1 && customer.CIPH1.includes(searchQuery)) ||
      (customer.CIAF1 && customer.CIAF1.toLowerCase().includes(searchLower)) ||
      (customer.CIID && customer.CIID.includes(searchQuery))
    );
  }, [filteredData, searchQuery]);

  // Sorting
  const { sortedData, sortConfig, onSort } = useSorting({ 
    data: searchingData, 
    initialSort: { key: 'CISEQ', direction: 'desc' } 
  });

  // Pagination
  const { 
    paginatedData, 
    currentPage, 
    pageSize, 
    totalPages, 
    goToPage, 
    setPageSize: changePageSize 
  } = usePagination({ data: sortedData, initialPageSize: 25 });

  // Handlers
  const handleEdit = (customer: any) => {
    setSelectedCustomer(customer);
    setIsEditModalOpen(true);
  };

  const resetFilters = () => {
    setFilters(initialFilters);
    setSearchQuery('');
  };

  // Check if any filter is active - Defined here to follow Rules of Hooks
  const isFilterActive = useMemo(() => {
    return searchQuery !== '' || 
           filters.status !== 'all' || 
           filters.dateFrom !== '' || 
           filters.dateTo !== '' || 
           filters.ciidFrom !== '' || 
           filters.ciidTo !== '';
  }, [searchQuery, filters]);

  const handleUpdate = async (formData: any) => {
    if (!token || !selectedCustomer) return;
    setIsSubmitting(true);
    try {
      const updateData: any = {};
      
      // Mapping from formData names back to API names if needed
      // Here CustomerEditModal already provides structured data but we need to compare
      const mappings = [
        { api: 'CINA', form: 'nameA' },
        { api: 'CINE', form: 'nameE' },
        { api: 'CIDE', form: 'detail' },
        { api: 'CIPH1', form: 'phone' },
        { api: 'CIEM', form: 'email' },
        { api: 'CIADD', form: 'address' },
        { api: 'CICO', form: 'country' },
        { api: 'CILAN', form: 'lan' },
        { api: 'CINU', form: 'cinu' },
        { api: 'CIST', form: 'status' },
        { api: 'CIFD', form: 'cifd', isDate: true },
        { api: 'CITD', form: 'citd', isDate: true },
        { api: 'CIDLM', form: 'dlm' },
        { api: 'CIAF1', form: 'branch' },
        { api: 'CIAF10', form: 'system' },
        { api: 'CIAF2', form: 'af2' },
        { api: 'CIAF3', form: 'af3' },
        { api: 'CIAF4', form: 'af4' },
        { api: 'CIAF5', form: 'af5' },
      ];

      mappings.forEach(m => {
        let currentVal = selectedCustomer[m.api];
        let newVal = formData[m.form];
        
        if (m.isDate && currentVal) {
          currentVal = currentVal.split('T')[0];
        }
        
        if (newVal !== currentVal) {
          updateData[m.api] = newVal;
        }
      });

      if (Object.keys(updateData).length === 0) {
        toast({ title: 'تنبيه', description: 'لم يتم تغيير أي بيانات' });
        setIsEditModalOpen(false);
        return;
      }

      await updateCustomer(selectedCustomer.CIORG, updateData, token);
      toast({ title: 'تم التحديث بنجاح', description: 'تم تحديث بيانات العميل بنجاح' });
      setIsEditModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    } catch (error) {
      toast({
        title: 'فشل التحديث',
        description: error instanceof Error ? error.message : 'حدث خطأ أثناء الاتصال بالسيرفر',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteConfirm = (org: string) => {
    setCustomerToDelete(org);
    setIsDeleteModalOpen(true);
  };

  const executeDelete = async () => {
    if (!token || !customerToDelete) return;
    setIsSubmitting(true);
    try {
      await deleteCustomer(customerToDelete, token);
      toast({ title: 'تم الحذف بنجاح', description: `تم حذف المنظمة ${customerToDelete} بنجاح` });
      setIsDeleteModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ['customers'] });
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

  const handleExport = () => {
    if (sortedData.length === 0) return;
    
    exportToCSV({
      filename: `تقرير_العملاء_${new Date().toISOString().split('T')[0]}`,
      headers: [
        "معرف العميل (SEQ)", "الرقم العام (ID)", "كود المنظمة (ORG)", "الفرع (AF1)", 
        "اسم العميل", "الهاتف", "تاريخ الإضافة", "تاريخ النهاية", "الحالة", 
        "عدد الأجهزة", "حد الرسائل"
      ],
      data: sortedData.map(c => [
        c.CISEQ, c.CIID || '', c.CIORG, c.CIAF1 || 'الرئيسي', 
        c.CINA || '', c.CIPH1 || '', 
        c.DATEI ? new Date(c.DATEI).toLocaleDateString('ar-YE') : '',
        c.CITD ? new Date(c.CITD).toLocaleDateString('ar-YE') : '',
        c.CIST === 1 ? 'فعال' : 'موقوف',
        c.CINU, c.CIDLM
      ])
    });

    toast({ title: "تم التصدير بنجاح", description: "تم استخراج ملف CSV بنجاح" });
  };

  if (isLoading) return <PageLoader message="جاري تحميل بيانات العملاء..." />;
  if (error) return <PageError onRetry={() => refetch()} />;

  const columns = getCustomerColumns(handleEdit, handleDeleteConfirm);

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto">
      {/* Premium Header */}
      <div className="relative space-y-4">
        <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-muted-foreground/60 font-bold">
          <span>الرئيسية</span>
          <ChevronLeft className="w-3 h-3" />
          <span className="text-primary">العملاء</span>
        </div>
        
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-1">
            <h1 className="text-3xl lg:text-4xl font-black text-foreground tracking-tight flex items-center gap-4">
              إدارة العملاء
            </h1>
            <p className="text-sm text-muted-foreground font-medium max-w-2xl px-1">
              إدارة المنظمات والاشتراكات وتخصيص حدود الرسائل والأجهزة لكل عميل
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <Button variant="outline" className="h-11 px-5 rounded-xl border-border/60" onClick={handleExport}>
              <FileDown className="w-4 h-4 ml-2" />
              تصدير
            </Button>
            <Link to="/dashboard/customers/add">
              <Button className="h-11 px-6 rounded-xl shadow-xl shadow-primary/20 hover:scale-[1.02] transition-all">
                <Plus className="w-4 h-4 ml-2" />
                إضافة عميل
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard 
          title="إجمالي العملاء" 
          value={customers.length} 
          icon={Building2} 
          variant="primary" 
        />
        <StatsCard 
          title="العملاء النشطون" 
          value={customers.filter(c => c.CIST === 1).length} 
          icon={Building2} 
          variant="success" 
        />
        <StatsCard 
          title="إجمالي الأجهزة" 
          value={customers.reduce((acc, c) => acc + (c.CINU || 0), 0)} 
          icon={Smartphone} 
          variant="warning" 
        />
        <StatsCard 
          title="الجلسات المتصلة" 
          value={customers.reduce((acc, c) => acc + (c.CIAF7 || 0), 0)} 
          icon={Smartphone} 
          variant="primary" 
        />
      </div>

      {/* Search & Filters */}
      <SearchFilterBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        showAdvancedFilters={showAdvancedFilters}
        setShowAdvancedFilters={setShowAdvancedFilters}
        searchPlaceholder="البحث بالاسم، الهاتف، الفرع أو الرقم العام..."
      >
        <div className="space-y-4 p-4 lg:p-6 bg-card/40 backdrop-blur-xl border border-primary/5 rounded-2xl mt-4 shadow-2xl shadow-black/5 animate-in slide-in-from-top-2 duration-300">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-primary/10">
            <div className="space-y-1">
              <h3 className="text-base font-black text-foreground flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-primary" />
                خيارات التصفية المتقدمة
              </h3>
              <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">قم بتخصيص عرض البيانات بناءً على معايير محددة</p>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={resetFilters}
              className="h-9 px-4 text-[11px] font-bold text-destructive hover:bg-destructive/5 hover:border-destructive/30 border-destructive/10 rounded-xl flex items-center gap-2 transition-all active:scale-95 shadow-sm"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              تصفير كافة الفلاتر
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatusFilter 
              value={filters.status} 
              onChange={(v) => setFilters(prev => ({ ...prev, status: v }))} 
              label="الحالة"
              options={[
                { label: 'الكل', value: 'all' },
                { label: 'فعال', value: 'active' },
                { label: 'موقوف', value: 'inactive' },
              ]}
            />
            <RangeFilter 
              label="الرقم العام (CIID)"
              from={filters.ciidFrom}
              to={filters.ciidTo}
              onFromChange={(v) => setFilters(prev => ({ ...prev, ciidFrom: v }))}
              onToChange={(v) => setFilters(prev => ({ ...prev, ciidTo: v }))}
            />
            <div className="lg:col-span-2">
              <DateRangeFilter 
                label="تاريخ الإضافة"
                dateFrom={filters.dateFrom}
                dateTo={filters.dateTo}
                onDateFromChange={(v) => setFilters(prev => ({ ...prev, dateFrom: v }))}
                onDateToChange={(v) => setFilters(prev => ({ ...prev, dateTo: v }))}
                onQuickSelect={(period) => {
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
                }}
              />
            </div>
          </div>
        </div>
      </SearchFilterBar>

      {/* Desktop Table View */}
      <div className="hidden lg:block overflow-hidden rounded-2xl border bg-card/50 backdrop-blur-sm shadow-xl shadow-black/5">
        <DataTable
          data={paginatedData}
          columns={columns}
          onSort={onSort}
          sortConfig={sortConfig}
          keyExtractor={(item) => item.CISEQ}
        />
      </div>

      {/* Mobile Card View */}
      <div className="lg:hidden space-y-3">
        {paginatedData.map((customer, index) => (
          <MobileCard
            key={customer.CISEQ}
            delay={index * 0.05}
            title={customer.CINA || customer.CINE || 'بدون اسم'}
            subtitle={customer.CIORG}
            icon={<Building2 className="w-5 h-5 text-primary" />}
            actions={
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreHorizontal className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-40">
                  <DropdownMenuItem className="gap-2" onClick={() => handleEdit(customer)}>
                    <Edit2 className="w-4 h-4" /> تعديل
                  </DropdownMenuItem>
                  <DropdownMenuItem className="gap-2 text-destructive" onClick={() => handleDeleteConfirm(customer.CIORG)}>
                    <Trash2 className="w-4 h-4" /> حذف
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            }
            details={
              <>
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
              </>
            }
            footer={
              <>
                <p className="text-[10px] text-muted-foreground">الرقم العام: {customer.CIID || '-'}</p>
                <p className="text-[10px] text-muted-foreground">الفرع: {customer.CIAF1 || 'الرئيسي'}</p>
              </>
            }
            status={
              <div className="flex flex-col items-end gap-1">
                <StatusBadge status={customer.CIST === 1 ? 'active' : 'inactive'} />
                {customer.CIST !== 1 && customer.RES && (
                  <span className="text-[9px] text-destructive">{customer.RES}</span>
                )}
              </div>
            }
            stats={
              <>
                <MobileCardStat label="نشطة" value={customer.CIAF7 || 0} />
                <MobileCardStat label="رسائل" value={customer.CIAF8 || 0} />
                <MobileCardStat label="حد" value={customer.CIDLM} />
              </>
            }
          />
        ))}
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

      {/* Modals */}
      <AnimatePresence>
        {isEditModalOpen && (
          <CustomerEditModal
            open={isEditModalOpen}
            onOpenChange={setIsEditModalOpen}
            customer={selectedCustomer}
            onSubmit={handleUpdate}
            isSubmitting={isSubmitting}
          />
        )}
      </AnimatePresence>

      <DeleteConfirmModal
        open={isDeleteModalOpen}
        onOpenChange={setIsDeleteModalOpen}
        onConfirm={executeDelete}
        title="حذف العميل"
        description={`هل أنت متأكد من حذف العميل ${customerToDelete}؟ سيتم حذف جميع الأجهزة المرتبطة به ولا يمكن التراجع عن هذا الإجراء.`}
        isLoading={isSubmitting}
      />
    </div>
  );
}
