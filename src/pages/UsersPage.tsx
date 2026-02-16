import { useState, useMemo } from "react";
import { useSearchParams, Link } from "react-router-dom";
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
  ArrowUpDown,
  Loader2,
  History,
  X,
  Plus,
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
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

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
    paginatedData: paginatedDevices,
    currentPage,
    setCurrentPage,
    pageSize,
    totalPages,
    setPageSize,
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
      console.log("QR Response:", response);

      const qrCode =
        response.data?.qr ||
        response.data?.qrcode ||
        (typeof response.data === "string" ? response.data : null);

      if (qrCode) {
        setSelectedDevice((prev: any) => ({ ...prev, SOMQR: qrCode }));
      } else {
        console.warn("QR code not found in response data");
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

          <div className="flex items-center gap-3">
            <Link to="/dashboard/users/add">
              <Button className="h-11 px-6 rounded-xl shadow-xl shadow-primary/20 hover:scale-[1.02] transition-all">
                <Plus className="w-4 h-4 ml-2" />
                إضافة جلسة جديدة
              </Button>
            </Link>
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

          {/* Advanced Filters */}
          <AnimatePresence>
            {showAdvancedFilters && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="pt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 border-t border-border mt-2">
                  <div className="space-y-2">
                    <Label className="text-xs">الحالة</Label>
                    <Select
                      value={filters.status}
                      onValueChange={(v) => setFilters(prev => ({ ...prev, status: v }))}
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue placeholder="اختر الحالة" />
                      </SelectTrigger>
                      <SelectContent dir="rtl">
                        <SelectItem value="all">جميع الحالات</SelectItem>
                        <SelectItem value="ready">Ready</SelectItem>
                        <SelectItem value="logout">logout</SelectItem>
                        <SelectItem value="qr">QR</SelectItem>
                        <SelectItem value="authenticated">
                          authenticated
                        </SelectItem>
                        <SelectItem value="maxqrcodetries">MaxQR</SelectItem>
                        <SelectItem value="none">none</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs">السيرفر</Label>
                    <Select
                      value={filters.server}
                      onValueChange={(v) => setFilters(prev => ({ ...prev, server: v }))}
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue placeholder="اختر السيرفر" />
                      </SelectTrigger>
                      <SelectContent dir="rtl">
                        <SelectItem value="all">جميع السيرفرات</SelectItem>
                        {servers.map((s: any, idx: number) => (
                          <SelectItem
                            key={`${s.SISN}-${s.SISEQ}-${idx}`}
                            value={s.SISN}
                          >
                            {s.SISN}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs">التاريخ</Label>
                    <Select
                      value={filters.date}
                      onValueChange={(v) => setFilters(prev => ({ ...prev, date: v }))}
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue placeholder="اختر الفترة" />
                      </SelectTrigger>
                      <SelectContent dir="rtl">
                        <SelectItem value="all">كل الأوقات</SelectItem>
                        <SelectItem value="hour">آخر ساعة</SelectItem>
                        <SelectItem value="day">آخر 24 ساعة</SelectItem>
                        <SelectItem value="week">آخر أسبوع</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs">رقم العميل (من - إلى)</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        placeholder="من"
                        value={filters.customerFrom}
                        onChange={(e) => setFilters(prev => ({ ...prev, customerFrom: e.target.value }))}
                        className="h-9"
                      />
                      <Input
                        placeholder="إلى"
                        value={filters.customerTo}
                        onChange={(e) => setFilters(prev => ({ ...prev, customerTo: e.target.value }))}
                        className="h-9"
                      />
                    </div>
                  </div>
                </div>
                <div className="flex justify-end mt-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs h-8"
                    onClick={() => {
                      setFilters(initialFilters);
                    }}
                  >
                    إعادة تعيين الفلاتر
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </SearchFilterBar>

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
                <th
                  className="min-w-[100px] cursor-pointer hover:bg-muted"
                  onClick={() => {
                    /* handleSort implementation */
                  }}
                >
                  <div className="flex items-center gap-1">
                    Session ID <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="min-w-[100px] cursor-pointer hover:bg-muted">
                  <div className="flex items-center gap-1">
                    رمز المستخدم <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="min-w-[120px] cursor-pointer hover:bg-muted">
                  <div className="flex items-center gap-1">
                    رقم العميل <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="min-w-[150px] cursor-pointer hover:bg-muted">
                  <div className="flex items-center gap-1">
                    اسم العميل <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="min-w-[120px] cursor-pointer hover:bg-muted">
                  <div className="flex items-center gap-1">
                    اسم الخادم <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="min-w-[120px]">الحالة</th>
                <th className="min-w-[160px]">تاريخ آخر رسالة</th>
                <th className="min-w-[100px]">الرسائل المسموحة / اليوم</th>
                <th className="min-w-[140px]">الرسائل المرسلة عام</th>
                <th className="min-w-[140px]">الرسائل المرسلة اليوم</th>
                <th className="min-w-[100px]">رمز السيرفر</th>
                <th
                  className="sticky left-0 bg-muted/50 z-10"
                  style={{ backgroundColor: "oklch(96.8% 0.007 247.896)" }}
                >
                  إجراءات
                </th>
              </tr>
            </thead>
            <tbody>
              {paginatedDevices.map((device, index) => {
                const deviceKey = `${device.session_id || ""}-${device.user_code || ""}-${device.customer_number || ""}-${index}`;
                return (
                  <motion.tr
                    key={deviceKey}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.03 }}
                  >
                    <td className="font-mono text-xs">{device.session_id}</td>
                    <td className="font-mono text-xs">{device.user_code}</td>
                    <td className="font-mono text-xs">
                      {device.customer_number}
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                          <Building2 className="w-3.5 h-3.5 text-primary" />
                        </div>
                        <span className="font-medium">
                          {device.SOMNA || device.customer_name || "بدون اسم"}
                        </span>
                      </div>
                    </td>
                    <td>{device.server_name || "-"}</td>
                    <td>
                      <StatusBadge status={device.status} />
                    </td>
                    <td className="text-[10px]">
                      {device.last_message_date
                        ? new Date(device.last_message_date).toLocaleString(
                          "ar-YE",
                        )
                        : "-"}
                    </td>
                    <td>
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded-lg bg-muted text-[10px] font-medium border border-border/50">
                        {device.message_limit || device.daily_limit || "-"}
                      </span>
                    </td>
                    <td className="text-[10px]">
                      <div className="flex flex-col gap-0.5">
                        <div className="flex items-center gap-1 text-foreground/80">
                          <MessageSquare className="w-2.5 h-2.5 text-muted-foreground" />
                          <span className="font-medium">
                            الكل: {device.total_messages || 0}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-[9px] text-muted-foreground pr-3.5">
                          <span>
                            (
                            {device.total_text ||
                              device.total_text_messages ||
                              0}{" "}
                            نص -{" "}
                            {device.total_attachments ||
                              device.total_attachment_messages ||
                              0}{" "}
                            مرفق)
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="text-[10px]">
                      <div className="flex flex-col gap-0.5">
                        <div className="flex items-center gap-1 text-primary">
                          <MessageSquare className="w-2.5 h-2.5" />
                          <span className="font-medium">
                            اليوم: {device.today_messages || 0}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-[9px] text-primary/70 pr-3.5">
                          <span>
                            (
                            {device.today_text ||
                              device.today_text_messages ||
                              0}{" "}
                            نص -{" "}
                            {device.today_attachments ||
                              device.today_attachment_messages ||
                              0}{" "}
                            مرفق)
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="font-mono text-[10px] uppercase">
                      {device.server_code || "-"}
                    </td>
                    <td className="sticky left-0 bg-background/95 backdrop-blur-sm border-r z-10">
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleShowQR(device)}
                          title="عرض رمز QR"
                        >
                          <QrCode className="w-4 h-4 text-primary" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleRestart(device)}
                          disabled={restartingIds.has(
                            String(device.session_id || device.user_code),
                          )}
                          title="إعادة تشغيل"
                        >
                          {restartingIds.has(
                            String(device.session_id || device.user_code),
                          ) ? (
                            <Loader2 className="w-4 h-4 text-success animate-spin" />
                          ) : (
                            <RefreshCw className="w-4 h-4 text-success" />
                          )}
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                            >
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent
                            align="end"
                            className="w-44 text-right"
                          >
                            <DropdownMenuItem
                              className="gap-2 justify-end"
                              onClick={() => {
                                setSelectedDevice(device);
                                setIsEditModalOpen(true);
                              }}
                            >
                              تعديل
                              <History className="w-4 h-4" />
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="gap-2 text-destructive justify-end"
                              onClick={() => handleDeleteConfirm(device)}
                            >
                              حذف
                              <Trash2 className="w-4 h-4" />
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

        {paginatedDevices.length === 0 && (
          <div className="p-12 text-center">
            <Smartphone className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground">لا توجد أجهزة</p>
          </div>
        )}
      </motion.div>

      {/* Mobile Cards */}
      <div className="lg:hidden space-y-3">
        {paginatedDevices.map((device, index) => {
          const deviceKey = `mobile-${device.session_id || ""}-${device.user_code || ""}-${device.customer_number || ""}-${index}`;
          return (
            <motion.div
              key={deviceKey}
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
                    <p className="font-semibold text-foreground">
                      {device.SOMNA || device.user_name || "جهاز بدون اسم"}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {device.customer_name}
                    </p>
                    <p
                      className="text-xs text-muted-foreground font-mono mt-0.5"
                      dir="ltr"
                    >
                      {device.session_id}
                    </p>
                  </div>
                </div>
                <StatusBadge status={device.status} />
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px] border-t border-border pt-3">
                <div className="space-y-1">
                  <p className="text-muted-foreground">اليوم</p>
                  <div className="flex flex-col">
                    <span className="font-medium text-success">
                      {device.today_messages}
                    </span>
                    <span className="text-[9px] text-muted-foreground">
                      ({device.today_text} - {device.today_attachments})
                    </span>
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-muted-foreground">الإجمالي</p>
                  <div className="flex flex-col">
                    <span className="font-medium">{device.total_messages}</span>
                    <span className="text-[9px] text-muted-foreground">
                      ({device.total_text} - {device.total_attachments})
                    </span>
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-muted-foreground">السيرفر</p>
                  <p className="font-medium truncate">{device.server_name}</p>
                  <p className="text-[9px] text-primary">
                    {device.server_code}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-muted-foreground">رقم العميل</p>
                  <p className="font-medium">{device.customer_number}</p>
                  <p className="text-[9px] text-muted-foreground">
                    Code: {device.user_code}
                  </p>
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
                  onClick={() => handleRestart(device)}
                  disabled={restartingIds.has(
                    String(device.session_id || device.user_code),
                  )}
                >
                  {restartingIds.has(
                    String(device.session_id || device.user_code),
                  ) ? (
                    <Loader2 className="w-4 h-4 text-success animate-spin" />
                  ) : (
                    <RefreshCw className="w-4 h-4 text-success" />
                  )}
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
                      onClick={() => {
                        setSelectedDevice(device);
                        setIsEditModalOpen(true);
                      }}
                    >
                      تعديل
                      <History className="w-4 h-4" />
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="gap-2 text-destructive justify-end"
                      onClick={() => handleDeleteConfirm(device)}
                    >
                      حذف
                      <Trash2 className="w-4 h-4" />
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </motion.div>
          );
        })}

        {paginatedDevices.length === 0 && (
          <div className="p-12 text-center bg-card rounded-xl border border-border">
            <Smartphone className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground">لا توجد أجهزة</p>
          </div>
        )}
      </div>

      {/* Pagination */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        pageSize={pageSize}
        totalItems={sortedData.length}
        onPageChange={setCurrentPage}
        onPageSizeChange={setPageSize}
      />

      {/* Modals */}
      <QrCodeModal
        open={isQRModalOpen}
        onOpenChange={setIsQRModalOpen}
        qrCode={selectedDevice?.SOMQR || null}
        isLoading={isLoadingQR}
        onRefresh={() => handleShowQR(selectedDevice)}
        deviceName={selectedDevice?.SOMNA || selectedDevice?.customer_name}
      />

      <UserEditModal
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        user={selectedDevice}
        onSubmit={handleUpdate}
        isSubmitting={isSubmitting}
      />

      <DeleteConfirmModal
        open={isDeleteModalOpen}
        onOpenChange={setIsDeleteModalOpen}
        onConfirm={executeDelete}
        title="حذف الجلسة"
        description={`هل أنت متأكد من حذف الجلسة ${selectedDevice?.session_id}؟ هذا الإجراء لا يمكن التراجع عنه.`}
        isLoading={isSubmitting}
      />
    </div >
  );
}
