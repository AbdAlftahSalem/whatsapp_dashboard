import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
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
  ArrowUpDown,
  Server as ServerIcon,
  MessageSquare,
  Paperclip,
} from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getAllUsersFull,
  deleteUser,
  updateUser,
  getQrCode,
  restartSession,
  stopSession,
  getServers,
} from "@/lib/api";
import {
  format,
  parseISO,
  isAfter,
  subHours,
  subDays,
  subWeeks,
} from "date-fns";
import { ar } from "date-fns/locale";
import { useAuthStore } from "@/stores/authStore";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/ui/StatusBadge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function UsersPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDevice, setSelectedDevice] = useState<any>(null);
  const [showQRModal, setShowQRModal] = useState(false);
  const [isLoadingQR, setIsLoadingQR] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editData, setEditData] = useState({ name: "", detail: "", phone: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pageSize, setPageSize] = useState(20);
  const [currentPage, setCurrentPage] = useState(1);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [serverFilter, setServerFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>("all");
  const [customerFrom, setCustomerFrom] = useState("");
  const [customerTo, setCustomerTo] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [restartingIds, setRestartingIds] = useState<Set<string>>(new Set());

  const { toast } = useToast();
  const { accessToken: token } = useAuthStore();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const orgFilter = searchParams.get("org");

  const {
    data: usersData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["users-full", orgFilter],
    queryFn: getAllUsersFull,
    refetchInterval: 60000, // Refresh every 60s as required
  });

  const { data: serversData } = useQuery({
    queryKey: ["servers"],
    queryFn: getServers,
  });

  const servers = serversData?.data?.servers || [];

  const devices = usersData?.data.data || [];

  const SessionStatus = ({ status }: { status: string }) => {
    const s = String(status).toLowerCase();
    switch (s) {
      case "ready":
        return (
          <div className="flex items-center gap-1.5 text-success">
            <Wifi className="w-4 h-4" />
            <span className="text-[10px] font-bold uppercase tracking-wider">
              Ready
            </span>
          </div>
        );
      case "logout":
        return (
          <div className="flex items-center gap-1.5 text-destructive">
            <XCircle className="w-4 h-4" />
            <span className="text-[10px] font-bold uppercase tracking-wider">
              logout
            </span>
          </div>
        );
      case "qr":
        return (
          <div className="flex items-center gap-1.5 text-warning">
            <WifiOff className="w-4 h-4" />
            <span className="text-[10px] font-bold uppercase tracking-wider">
              QR
            </span>
          </div>
        );
      case "authenticated":
        return (
          <div className="flex items-center gap-1.5 text-blue-500">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-[10px] font-bold uppercase tracking-wider">
              authenticated
            </span>
          </div>
        );
      case "maxqrcodetries":
        return (
          <div className="flex items-center gap-1.5 text-warning">
            <WifiOff className="w-4 h-4" />
            <span className="text-[10px] font-bold uppercase tracking-wider">
              MaxQR
            </span>
          </div>
        );
      case "none":
        return (
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <WifiOff className="w-4 h-4" />
            <span className="text-[10px] font-bold uppercase tracking-wider">
              none
            </span>
          </div>
        );
      default:
        return (
          <div className="flex items-center gap-1.5 text-destructive">
            <WifiOff className="w-4 h-4" />
            <span className="text-[10px] font-bold uppercase tracking-wider">
              {status || "Not Ready"}
            </span>
          </div>
        );
    }
  };

  const filteredDevices = devices.filter((device) => {
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch =
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
      statusFilter === "all" ||
      String(device.status).toLowerCase() === statusFilter.toLowerCase();
    const matchesServer =
      serverFilter === "all" ||
      device.server_code === serverFilter ||
      device.server_name === serverFilter;

    // Customer Number Range
    let matchesCustomerRange = true;
    if (customerFrom)
      matchesCustomerRange =
        matchesCustomerRange &&
        Number(device.customer_number) >= Number(customerFrom);
    if (customerTo)
      matchesCustomerRange =
        matchesCustomerRange &&
        Number(device.customer_number) <= Number(customerTo);

    // Date Filter
    let matchesDate = true;
    if (dateFilter !== "all" && device.last_message_date) {
      const lastDate = parseISO(device.last_message_date);
      const now = new Date();
      if (dateFilter === "hour")
        matchesDate = isAfter(lastDate, subHours(now, 1));
      else if (dateFilter === "day")
        matchesDate = isAfter(lastDate, subDays(now, 1));
      else if (dateFilter === "week")
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
  });

  const totalPages = Math.ceil(filteredDevices.length / pageSize);
  const paginatedDevices = filteredDevices.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );

  const handleShowQR = async (device: any) => {
    setSelectedDevice(device);
    setIsLoadingQR(true);
    setShowQRModal(true);

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
      console.error("Failed to fetch QR code. Detailed Error:", error);
      toast({
        title: "خطأ",
        description: error.message || "فشل في جلب رمز QR",
        variant: "destructive",
      });
    } finally {
      setIsLoadingQR(false);
    }
  };

  const handleDelete = (device: any) => {
    setSelectedDevice(device);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!selectedDevice) return;
    setIsSubmitting(true);
    const userId = String(
      selectedDevice.session_id || selectedDevice.user_code,
    );
    try {
      const response = await stopSession(userId);
      if (response.success || response.status) {
        toast({
          title: "تم الحذف بنجاح",
          description: `تم حذف الجهاز ${userId} بنجاح`,
        });
        queryClient.invalidateQueries({ queryKey: ["users-full"] });
        setShowDeleteConfirm(false);
      } else {
        throw new Error(response.message || "Failed to stop session");
      }
    } catch (error: any) {
      console.error("Stop Session Error:", error);
      toast({
        title: "فشل الحذف",
        description: error.message || "حدث خطأ غير متوقع",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (device: any) => {
    setSelectedDevice(device);
    setEditData({
      name: device.SOMNA || device.user_name || device.customer_name || "",
      detail: "",
      phone: device.session_id || "",
    });
    setShowEditModal(true);
  };

  const handleUpdate = async () => {
    if (!token || !selectedDevice) return;
    setIsSubmitting(true);
    try {
      await updateUser(
        String(selectedDevice.session_id || selectedDevice.user_code),
        editData,
        token,
      );
      toast({
        title: "تم التحديث بنجاح",
        description: "تم تحديث بيانات الجهاز بنجاح",
      });
      setShowEditModal(false);
      queryClient.invalidateQueries({ queryKey: ["users"] });
    } catch (error) {
      toast({
        title: "فشل التحديث",
        description:
          error instanceof Error ? error.message : "حدث خطأ غير متوقع",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRestartSession = async (device: any) => {
    const userId = String(device.session_id || device.user_code);

    // Set restarting state
    setRestartingIds((prev) => new Set(prev).add(userId));

    toast({
      title: "جاري إعادة تشغيل الجلسة",
      description: `إعادة تشغيل جلسة ${device.SOMNA || device.customer_name || device.session_id}...`,
    });

    try {
      const response = await restartSession(userId);
      console.log("Restart Session Response:", response);

      if (response.status || response.message) {
        toast({
          title: "تم إرسال طلب إعادة التشغيل",
          description:
            response.message || "تم إرسال الطلب بنجاح، جاري تحديث الحالة...",
        });

        // Start a timeout to clear the restarting state if status doesn't change
        setTimeout(() => {
          setRestartingIds((prev) => {
            const next = new Set(prev);
            next.delete(userId);
            return next;
          });
        }, 60000); // 60s timeout as planned

        queryClient.invalidateQueries({ queryKey: ["users-full"] });
      } else {
        throw new Error(response.message || "Failed to restart session");
      }
    } catch (error: any) {
      console.error("Restart Session Error:", error);
      setRestartingIds((prev) => {
        const next = new Set(prev);
        next.delete(userId);
        return next;
      });
      toast({
        title: "فشل إعادة التشغيل",
        description: error.message || "حدث خطأ أثناء إعادة تشغيل الجلسة",
        variant: "destructive",
      });
    }
  };

  const handleDeleteSession = (device: any) => {
    toast({
      title: "تأكيد الحذف",
      description: `هل أنت متأكد من حذف ${device.SOMNA || device.customer_name || device.session_id}؟`,
      variant: "destructive",
    });
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
        <p className="text-muted-foreground animate-pulse">
          جاري تحميل بيانات الأجهزة...
        </p>
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
          <h3 className="text-lg font-semibold text-foreground">
            فشل تحميل بيانات الأجهزة
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            يرجى التحقق من اتصالك بالخادم والمحاولة مرة أخرى
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 lg:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-foreground">
            الأجهزة{" "}
            {orgFilter && (
              <span className="text-primary font-normal"> - {orgFilter}</span>
            )}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            إدارة أجهزة واتساب والجلسات
          </p>
        </div>
        <Link to="/dashboard/users/add">
          <Button className="gap-2 w-full sm:w-auto">
            <Plus className="w-4 h-4" />
            إضافة جهاز
          </Button>
        </Link>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col gap-4 bg-card p-4 rounded-xl border border-border shadow-sm">
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
          <div className="flex items-center gap-2">
            {orgFilter && (
              <Button
                variant="ghost"
                size="sm"
                className="gap-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={() => navigate("/dashboard/users")}
              >
                <X className="w-4 h-4" />
                إلغاء تصفية المنظمة
              </Button>
            )}
            <Button
              variant={showAdvancedFilters ? "secondary" : "outline"}
              className="gap-2"
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            >
              <Filter className="w-4 h-4" />
              تصفية متقدمة
            </Button>
          </div>
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
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
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
                  <Select value={serverFilter} onValueChange={setServerFilter}>
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
                  <Select value={dateFilter} onValueChange={setDateFilter}>
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
                      value={customerFrom}
                      onChange={(e) => setCustomerFrom(e.target.value)}
                      className="h-9"
                    />
                    <Input
                      placeholder="إلى"
                      value={customerTo}
                      onChange={(e) => setCustomerTo(e.target.value)}
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
                    setStatusFilter("all");
                    setServerFilter("all");
                    setDateFilter("all");
                    setCustomerFrom("");
                    setCustomerTo("");
                  }}
                >
                  إعادة تعيين الفلاتر
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
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
                      <SessionStatus status={device.status} />
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
                          onClick={() => handleRestartSession(device)}
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
                              onClick={() => handleEdit(device)}
                            >
                              تعديل
                              <History className="w-4 h-4" />
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="gap-2 text-destructive justify-end"
                              onClick={() => handleDelete(device)}
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
                <SessionStatus status={device.status} />
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
                  onClick={() => handleRestartSession(device)}
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
                      onClick={() => handleEdit(device)}
                    >
                      تعديل
                      <History className="w-4 h-4" />
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="gap-2 text-destructive justify-end"
                      onClick={() => handleDelete(device)}
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
            onClick={() => setCurrentPage((prev) => prev - 1)}
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
                  key={`page-${pageNum}-${i}`}
                  variant={currentPage === pageNum ? "default" : "outline"}
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
            onClick={() => setCurrentPage((prev) => prev + 1)}
          >
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
                  رمز QR -{" "}
                  {selectedDevice.SOMNA ||
                    selectedDevice.SOMDE ||
                    selectedDevice.USER}
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
                      <img
                        src={selectedDevice.SOMQR}
                        alt="QR Code"
                        className="w-full h-full object-contain"
                      />
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
                <p
                  className="text-xs text-muted-foreground mt-2 font-mono"
                  dir="ltr"
                >
                  {selectedDevice.SOMPH || "-"}
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

      {/* Delete Confirmation Modal */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent className="sm:max-w-md text-right" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-right text-destructive flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              تأكيد حذف الجلسة
            </DialogTitle>
            <DialogDescription className="text-right pt-2 text-foreground font-medium">
              هل أنت متأكد من رغبتك في حذف الجلسة{" "}
              <span className="font-mono bg-muted px-1.5 py-0.5 rounded text-destructive">
                {selectedDevice?.session_id}
              </span>
              ؟
            </DialogDescription>
          </DialogHeader>
          <div className="p-4 rounded-lg bg-destructive/5 border border-destructive/20 mt-2">
            <p className="text-sm text-muted-foreground leading-relaxed">
              هذا الإجراء نهائي ولا يمكن التراجع عنه. سيتم إزالة جميع البيانات
              المرتبطة بهذه الجلسة من النظام فوراً.
            </p>
          </div>
          <DialogFooter className="gap-2 sm:justify-start mt-4">
            <Button
              variant="outline"
              onClick={() => setShowDeleteConfirm(false)}
            >
              إلغاء
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={isSubmitting}
              className="gap-2"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4" />
              )}
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
                <DialogTitle className="text-right">
                  تعديل بيانات الجهاز
                </DialogTitle>
                <DialogDescription className="text-right">
                  تحديث معلومات الجهاز:{" "}
                  {selectedDevice?.SOMNA || selectedDevice?.customer_name}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2 text-right">
                  <Label htmlFor="edit-name">اسم الجهاز</Label>
                  <Input
                    id="edit-name"
                    value={editData.name}
                    onChange={(e) =>
                      setEditData({ ...editData, name: e.target.value })
                    }
                    placeholder="اسم الجهاز"
                  />
                </div>
                <div className="space-y-2 text-right">
                  <Label htmlFor="edit-phone">رقم الهاتف</Label>
                  <Input
                    id="edit-phone"
                    value={editData.phone}
                    onChange={(e) =>
                      setEditData({ ...editData, phone: e.target.value })
                    }
                    placeholder="رقم الهاتف"
                    dir="ltr"
                  />
                </div>
                <div className="space-y-2 text-right">
                  <Label htmlFor="edit-detail">التفاصيل / الموقع</Label>
                  <Input
                    id="edit-detail"
                    value={editData.detail}
                    onChange={(e) =>
                      setEditData({ ...editData, detail: e.target.value })
                    }
                    placeholder="التفاصيل"
                  />
                </div>
              </div>
              <DialogFooter className="gap-2 sm:justify-start">
                <Button
                  variant="outline"
                  onClick={() => setShowEditModal(false)}
                >
                  إلغاء
                </Button>
                <Button onClick={handleUpdate} disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                      جاري الحفظ...
                    </>
                  ) : (
                    "حفظ التغييرات"
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
