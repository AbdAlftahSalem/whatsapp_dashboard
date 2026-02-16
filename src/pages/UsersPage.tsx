import { useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Wifi,
  Smartphone,
  MessageSquare,
  Building2,
  Server as ServerIcon,
  RefreshCw,
  MoreHorizontal,
  Edit2,
  Trash2,
  QrCode,
  Calendar,
  Clock,
  ChevronLeft,
} from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getAllUsersFull,
  updateUser,
  getQrCode,
  restartSession,
  stopSession,
  getServers,
} from "@/lib/api";
import { parseISO, isAfter, subHours, subDays, subWeeks } from "date-fns";
import { useAuthStore } from "@/stores/authStore";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/DataTable";
import { SearchFilterBar } from "@/components/ui/SearchFilterBar";
import { PageLoader } from "@/components/ui/PageLoader";
import { PageError } from "@/components/ui/PageError";
import { StatsCard } from "@/components/ui/StatsCard";
import { MobileCard, MobileCardStat } from "@/components/ui/MobileCard";
import { Pagination } from "@/components/ui/Pagination";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { DeleteConfirmModal } from "@/components/ui/DeleteConfirmModal";
import { UserEditModal } from "@/features/users/components/UserEditModal";
import { QrCodeModal } from "@/features/users/components/QrCodeModal";
import { getUserColumns } from "@/features/users/components/UserTableColumns";
import { StatusFilter } from "@/components/filters/StatusFilter";
import { RangeFilter } from "@/components/filters/RangeFilter";

import { usePagination } from "@/hooks/usePagination";
import { useSorting } from "@/hooks/useSorting";
import { useFiltering } from "@/hooks/useFiltering";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function UsersPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState<any>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isLoadingQR, setIsLoadingQR] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [restartingIds, setRestartingIds] = useState<Set<string>>(new Set());

  const initialFilters = {
    status: "all",
    server: "all",
    date: "all",
    customerFrom: "",
    customerTo: "",
  };

  const [filters, setFilters] = useState(initialFilters);

  const { toast } = useToast();
  const { accessToken: token } = useAuthStore();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const orgFilter = searchParams.get("org");

  // Queries
  const {
    data: usersData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["users-full", orgFilter],
    queryFn: getAllUsersFull,
    refetchInterval: 60000,
  });

  const { data: serversData } = useQuery({
    queryKey: ["servers"],
    queryFn: getServers,
  });

  const devices = usersData?.data.data || [];
  const servers = serversData?.data?.servers || [];

  // Filtering
  const filterFn = (device: any, fs: any) => {
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch =
      !searchQuery ||
      (device.SOMNA && device.SOMNA.toLowerCase().includes(searchLower)) ||
      (device.user_name &&
        device.user_name.toLowerCase().includes(searchLower)) ||
      (device.customer_name &&
        device.customer_name.toLowerCase().includes(searchLower)) ||
      (device.session_id && device.session_id.includes(searchQuery)) ||
      (device.server_name &&
        device.server_name.toLowerCase().includes(searchLower)) ||
      String(device.customer_number).includes(searchQuery);

    const matchesOrg =
      !orgFilter || String(device.customer_number) === orgFilter;
    const matchesStatus =
      fs.status === "all" ||
      String(device.status).toLowerCase() === fs.status.toLowerCase();
    const matchesServer =
      fs.server === "all" ||
      device.server_code === fs.server ||
      device.server_name === fs.server;

    let matchesCustomerRange = true;
    if (fs.customerFrom)
      matchesCustomerRange =
        matchesCustomerRange &&
        Number(device.customer_number) >= Number(fs.customerFrom);
    if (fs.customerTo)
      matchesCustomerRange =
        matchesCustomerRange &&
        Number(device.customer_number) <= Number(fs.customerTo);

    let matchesDate = true;
    if (fs.date !== "all" && device.last_message_date) {
      const lastDate = parseISO(device.last_message_date);
      const now = new Date();
      if (fs.date === "hour") matchesDate = isAfter(lastDate, subHours(now, 1));
      else if (fs.date === "day")
        matchesDate = isAfter(lastDate, subDays(now, 1));
      else if (fs.date === "week")
        matchesDate = isAfter(lastDate, subWeeks(now, 1));
    }

    return (
      matchesSearch &&
      matchesOrg &&
      matchesStatus &&
      matchesServer &&
      matchesCustomerRange &&
      matchesDate
    );
  };

  const filteredData = useFiltering({ data: devices, filters, filterFn });

  // Sorting
  const { sortedData, sortConfig, onSort } = useSorting({
    data: filteredData,
    initialSort: { key: "session_id", direction: "asc" },
  });

  // Pagination
  const {
    paginatedData,
    currentPage,
    pageSize,
    totalPages,
    goToPage,
    setPageSize: changePageSize,
  } = usePagination({ data: sortedData, initialPageSize: 20 });

  // Handlers
  const resetFilters = () => {
    setFilters(initialFilters);
    setSearchQuery("");
  };

  // Check if any filter is active - Defined here to follow Rules of Hooks
  const isFilterActive = useMemo(() => {
    return (
      searchQuery !== "" ||
      filters.status !== "all" ||
      filters.server !== "all" ||
      filters.date !== "all" ||
      filters.customerFrom !== "" ||
      filters.customerTo !== ""
    );
  }, [searchQuery, filters]);

  const handleShowQR = async (device: any) => {
    setSelectedDevice(device);
    setIsLoadingQR(true);
    setIsQRModalOpen(true);
    try {
      const userId = String(device.session_id || device.user_code);
      const response = await getQrCode(userId);
      const qrCode =
        response.data?.qr ||
        response.data?.qrcode ||
        (typeof response.data === "string" ? response.data : null);
      if (qrCode) {
        setSelectedDevice((prev: any) => ({ ...prev, SOMQR: qrCode }));
      }
    } catch (error: any) {
      toast({
        title: "خطأ",
        description: error.message || "فشل في جلب رمز QR",
        variant: "destructive",
      });
    } finally {
      setIsLoadingQR(false);
    }
  };

  const handleRestart = async (device: any) => {
    const userId = String(device.session_id || device.user_code);
    setRestartingIds((prev) => new Set(prev).add(userId));
    toast({
      title: "جاري إعادة تشغيل الجلسة",
      description: `إعادة تشغيل جلسة ${device.SOMNA || device.session_id}...`,
    });
    try {
      const response = await restartSession(userId);
      if (response.status || response.message) {
        toast({
          title: "تم إرسال طلب إعادة التشغيل",
          description: response.message || "جاري تحديث الحالة...",
        });
        setTimeout(
          () =>
            setRestartingIds((prev) => {
              const next = new Set(prev);
              next.delete(userId);
              return next;
            }),
          60000,
        );
        queryClient.invalidateQueries({ queryKey: ["users-full"] });
      }
    } catch (error: any) {
      setRestartingIds((prev) => {
        const next = new Set(prev);
        next.delete(userId);
        return next;
      });
      toast({
        title: "فشل إعادة التشغيل",
        description: error.message || "حدث خطأ",
        variant: "destructive",
      });
    }
  };

  const handleUpdate = async (formData: any) => {
    if (!token || !selectedDevice) return;
    setIsSubmitting(true);
    try {
      await updateUser(
        String(selectedDevice.session_id || selectedDevice.user_code),
        {
          SOMNA: formData.customer_name,
          daily_limit: formData.message_limit,
        },
        token,
      );
      toast({
        title: "تم التحديث بنجاح",
        description: "تم تحديث بيانات الجلسة",
      });
      setIsEditModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ["users-full"] });
    } catch (error: any) {
      toast({
        title: "فشل التحديث",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteConfirm = (device: any) => {
    setSelectedDevice(device);
    setIsDeleteModalOpen(true);
  };

  const executeDelete = async () => {
    if (!selectedDevice) return;
    setIsSubmitting(true);
    try {
      await stopSession(
        String(selectedDevice.session_id || selectedDevice.user_code),
      );
      toast({ title: "تم الحذف بنجاح", description: "تم حذف الجهاز بنجاح" });
      setIsDeleteModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ["users-full"] });
    } catch (error: any) {
      toast({
        title: "فشل الحذف",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) return <PageLoader message="جاري تحميل الجلسات..." />;
  if (error) return <PageError onRetry={() => refetch()} />;

  const columns = getUserColumns({
    onShowQR: handleShowQR,
    onRestart: handleRestart,
    onEdit: (d) => {
      setSelectedDevice(d);
      setIsEditModalOpen(true);
    },
    onDelete: handleDeleteConfirm,
    restartingIds,
  });

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="relative space-y-4">
        <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-muted-foreground/60 font-bold">
          <span>الرئيسية</span>
          <ChevronLeft className="w-3 h-3" />
          <span className="text-primary">الجلسات</span>
        </div>

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-1">
            <h1 className="text-3xl lg:text-4xl font-black text-foreground tracking-tight flex items-center gap-4">
              إدارة الجلسات
            </h1>
            <p className="text-sm text-muted-foreground font-medium max-w-2xl px-1">
              مراقبة وإدارة جميع جلسات واتساب النشطة، وتتبع حالة الاتصال وحجم
              الرسائل لكل جلسة
            </p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="إجمالي الأجهزة"
          value={devices.length}
          icon={Smartphone}
          variant="primary"
        />
        <StatsCard
          title="أجهزة متصلة"
          value={
            devices.filter((d) => String(d.status).toLowerCase() === "ready")
              .length
          }
          icon={Wifi}
          variant="success"
        />
        <StatsCard
          title="تحتاج ربط (QR)"
          value={
            devices.filter((d) => String(d.status).toLowerCase() === "qr")
              .length
          }
          icon={QrCode}
          variant="warning"
        />
        <StatsCard
          title="رسائل اليوم"
          value={devices.reduce((acc, d) => acc + (d.messages_today || 0), 0)}
          icon={MessageSquare}
          variant="primary"
        />
      </div>

      {/* Filters */}
      <SearchFilterBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        showAdvancedFilters={showAdvancedFilters}
        setShowAdvancedFilters={setShowAdvancedFilters}
        searchPlaceholder="البحث بالاسم، الرقم، السيرفر أو المعرف..."
      >
        <div className="space-y-4 p-4 lg:p-6 bg-card/40 backdrop-blur-xl border border-primary/5 rounded-2xl mt-4 shadow-2xl shadow-black/5 animate-in slide-in-from-top-2 duration-300">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-primary/10">
            <div className="space-y-1">
              <h3 className="text-base font-black text-foreground flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-primary" />
                خيارات التصفية المتقدمة
              </h3>
              <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
                فلترة وسحب بيانات الجلسات بناءً على معايير دقيقة
              </p>
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

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            <StatusFilter
              label="حالة الاتصال"
              value={filters.status}
              onChange={(v) => setFilters((prev) => ({ ...prev, status: v }))}
              options={[
                { label: "الكل", value: "all" },
                { label: "Ready", value: "ready" },
                { label: "QR", value: "qr" },
                { label: "Logout", value: "logout" },
              ]}
            />
            <StatusFilter
              label="السيرفر"
              value={filters.server}
              onChange={(v) => setFilters((prev) => ({ ...prev, server: v }))}
              options={[
                { label: "الكل", value: "all" },
                ...servers
                  .filter((s) => s && (s.name || s.SISN || s.code || s.id))
                  .map((s) => ({
                    label: `${s.name || ""} (${s.SISN || s.code || s.id || "غير معرف"})`,
                    value: s.SISN || s.code || String(s.id || ""),
                  })),
              ]}
            />
            <StatusFilter
              label="آخر نشاط"
              value={filters.date}
              onChange={(v) => setFilters((prev) => ({ ...prev, date: v }))}
              options={[
                { label: "الكل", value: "all" },
                { label: "آخر ساعة", value: "hour" },
                { label: "آخر 24 ساعة", value: "day" },
                { label: "آخر أسبوع", value: "week" },
              ]}
            />
            <div className="xl:col-span-2">
              <RangeFilter
                label="نطاق رقم العميل"
                from={filters.customerFrom}
                to={filters.customerTo}
                onFromChange={(v) =>
                  setFilters((prev) => ({ ...prev, customerFrom: v }))
                }
                onToChange={(v) =>
                  setFilters((prev) => ({ ...prev, customerTo: v }))
                }
              />
            </div>
          </div>
        </div>
      </SearchFilterBar>

      {/* Table & Mobile Views */}
      <div className="hidden lg:block overflow-hidden rounded-2xl border bg-card/50 backdrop-blur-sm shadow-xl">
        <DataTable
          data={paginatedData}
          columns={columns}
          onSort={onSort}
          sortConfig={sortConfig}
          keyExtractor={(item, index) =>
            `${item.session_id}-${item.server_code}-${index}`
          }
        />
      </div>

      <div className="lg:hidden space-y-3">
        {paginatedData.map((device, index) => (
          <MobileCard
            key={`${device.session_id}-${device.server_code}-${index}`}
            delay={index * 0.05}
            title={device.SOMNA || device.customer_name || "بدون اسم"}
            subtitle={device.session_id}
            icon={<Smartphone className="w-5 h-5 text-primary" />}
            actions={
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreHorizontal className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem
                    className="gap-2"
                    onClick={() => handleShowQR(device)}
                  >
                    <QrCode className="w-4 h-4" /> عرض QR
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="gap-2 text-success"
                    onClick={() => handleRestart(device)}
                    disabled={restartingIds.has(device.session_id)}
                  >
                    <RefreshCw
                      className={
                        restartingIds.has(device.session_id)
                          ? "animate-spin"
                          : ""
                      }
                    />{" "}
                    إعادة تشغيل
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="gap-2"
                    onClick={() => {
                      setSelectedDevice(device);
                      setIsEditModalOpen(true);
                    }}
                  >
                    <Edit2 className="w-4 h-4" /> تعديل
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="gap-2 text-destructive"
                    onClick={() => handleDeleteConfirm(device)}
                  >
                    <Trash2 className="w-4 h-4" /> حذف
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            }
            details={
              <>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Building2 className="w-3 h-3" />{" "}
                  <span>{device.customer_number}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <ServerIcon className="w-3 h-3" />{" "}
                  <span>{device.server_name}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="w-3 h-3" />{" "}
                  <span>
                    {device.last_message_date
                      ? new Date(device.last_message_date).toLocaleDateString()
                      : "-"}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="w-3 h-3" />{" "}
                  <span>
                    {device.last_activity_date
                      ? new Date(device.last_activity_date).toLocaleTimeString()
                      : "-"}
                  </span>
                </div>
              </>
            }
            status={<StatusBadge status={device.status} />}
            stats={
              <>
                <MobileCardStat
                  label="رسائل"
                  value={device.messages_today || 0}
                />
                <MobileCardStat
                  label="حد"
                  value={device.message_limit || 100}
                />
                <MobileCardStat label="خطأ" value={device.errors_count || 0} />
              </>
            }
          />
        ))}
      </div>

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
          <UserEditModal
            open={isEditModalOpen}
            onOpenChange={setIsEditModalOpen}
            user={selectedDevice}
            onSubmit={handleUpdate}
            isSubmitting={isSubmitting}
          />
        )}
        {isQRModalOpen && (
          <QrCodeModal
            open={isQRModalOpen}
            onOpenChange={setIsQRModalOpen}
            qrCode={selectedDevice?.SOMQR}
            isLoading={isLoadingQR}
            onRefresh={() => handleShowQR(selectedDevice)}
            deviceName={selectedDevice?.SOMNA || selectedDevice?.session_id}
          />
        )}
      </AnimatePresence>

      <DeleteConfirmModal
        open={isDeleteModalOpen}
        onOpenChange={setIsDeleteModalOpen}
        onConfirm={executeDelete}
        title="حذف الجلسة"
        description={`هل أنت متأكد من حذف الجلسة ${selectedDevice?.session_id}؟`}
        isLoading={isSubmitting}
      />
    </div>
  );
}
