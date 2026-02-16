import * as React from "react";
import { Building2, MoreHorizontal, QrCode, RefreshCw, Loader2, MessageSquare, History, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Column } from "@/components/ui/DataTable";
import { formatDateTime } from "@/lib/dateUtils";

interface UserColumnsProps {
  onShowQR: (device: any) => void;
  onRestart: (device: any) => void;
  onEdit: (device: any) => void;
  onDelete: (device: any) => void;
  restartingIds: Set<string>;
}

export const getUserColumns = ({
  onShowQR,
  onRestart,
  onEdit,
  onDelete,
  restartingIds,
}: UserColumnsProps): Column<any>[] => [
  {
    key: "session_id",
    header: "Session ID",
    sortable: true,
    className: "font-mono text-xs",
  },
  {
    key: "user_code",
    header: "رمز المستخدم",
    sortable: true,
    className: "font-mono text-xs",
  },
  {
    key: "customer_number",
    header: "رقم العميل",
    sortable: true,
    className: "font-mono text-xs",
  },
  {
    key: "SOMNA",
    header: "اسم العميل",
    sortable: true,
    cell: (item) => (
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
          <Building2 className="w-3.5 h-3.5 text-primary" />
        </div>
        <span className="font-medium">
          {item.SOMNA || item.customer_name || "بدون اسم"}
        </span>
      </div>
    ),
  },
  {
    key: "server_name",
    header: "اسم الخادم",
    sortable: true,
    cell: (item) => item.server_name || "-",
  },
  {
    key: "status",
    header: "الحالة",
    cell: (item) => <StatusBadge status={item.status} />,
  },
  {
    key: "last_message_date",
    header: "تاريخ آخر رسالة",
    className: "text-[10px]",
    cell: (item) => formatDateTime(item.last_message_date),
  },
  {
    key: "message_limit",
    header: "الحد اليومي",
    cell: (item) => (
      <span className="inline-flex items-center px-1.5 py-0.5 rounded-lg bg-muted text-[10px] font-medium border border-border/50">
        {item.message_limit || item.daily_limit || "-"}
      </span>
    ),
  },
  {
    key: "total_messages",
    header: "إجمالي الرسائل",
    className: "text-[10px]",
    cell: (item) => (
      <div className="flex flex-col gap-0.5">
        <div className="flex items-center gap-1 text-foreground/80">
          <MessageSquare className="w-2.5 h-2.5 text-muted-foreground" />
          <span className="font-medium">الكل: {item.total_messages || 0}</span>
        </div>
        <div className="flex items-center gap-1 text-[9px] text-muted-foreground pr-3.5">
          <span>({item.total_text || 0} نص - {item.total_attachments || 0} مرفق)</span>
        </div>
      </div>
    ),
  },
  {
    key: "today_messages",
    header: "رسائل اليوم",
    className: "text-[10px]",
    cell: (item) => (
      <div className="flex flex-col gap-0.5">
        <div className="flex items-center gap-1 text-primary">
          <MessageSquare className="w-2.5 h-2.5" />
          <span className="font-medium">اليوم: {item.today_messages || 0}</span>
        </div>
        <div className="flex items-center gap-1 text-[9px] text-primary/70 pr-3.5">
          <span>({item.today_text || 0} نص - {item.today_attachments || 0} مرفق)</span>
        </div>
      </div>
    ),
  },
  {
    key: "server_code",
    header: "رمز السيرفر",
    className: "font-mono text-[10px] uppercase",
  },
  {
    key: "ACTIONS",
    header: "الإجراءات",
    sticky: "left",
    cell: (item) => {
      const deviceId = String(item.session_id || item.user_code);
      const isRestarting = restartingIds.has(deviceId);
      
      return (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => onShowQR(item)}
            title="عرض رمز QR"
          >
            <QrCode className="w-4 h-4 text-primary" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => onRestart(item)}
            disabled={isRestarting}
            title="إعادة تشغيل"
          >
            {isRestarting ? (
              <Loader2 className="w-4 h-4 text-emerald-500 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4 text-emerald-500" />
            )}
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44 text-right">
              <DropdownMenuItem className="gap-2 justify-end" onClick={() => onEdit(item)}>
                تعديل
                <History className="w-4 h-4" />
              </DropdownMenuItem>
              <DropdownMenuItem className="gap-2 text-destructive justify-end" onClick={() => onDelete(item)}>
                حذف
                <Trash2 className="w-4 h-4" />
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      );
    },
  },
];
