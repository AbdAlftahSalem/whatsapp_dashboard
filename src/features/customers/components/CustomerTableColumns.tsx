import * as React from "react";
import { Building2, MoreHorizontal, Edit2, Smartphone, Trash2, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Link } from "react-router-dom";
import { Column } from "@/components/ui/DataTable";
import { formatDate, formatDateTime } from "@/lib/dateUtils";

export const getCustomerColumns = (
  onEdit: (customer: any) => void,
  onDelete: (org: string) => void,
): Column<any>[] => [
    {
      key: "CISEQ",
      header: "معرف العميل",
      sortable: true,
      className: "font-mono text-xs",
    },
    {
      key: "CIID",
      header: "الرقم العام",
      sortable: true,
      className: "font-mono text-xs",
      cell: (item) => item.CIID || '-',
    },
    {
      key: "CIAF1",
      header: "الفرع",
      sortable: true,
      cell: (item) => item.CIAF1 || 'الرئيسي',
    },
    {
      key: "CINA",
      header: "اسم العميل",
      sortable: true,
      cell: (item) => (
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <Building2 className="w-4 h-4 text-primary" />
          </div>
          <p className="font-medium text-foreground">{item.CINA || item.CINE || 'بدون اسم'}</p>
        </div>
      ),
    },
    {
      key: "CIPH1",
      header: "رقم الهاتف",
      className: "dir-ltr",
      cell: (item) => item.CIPH1 || '-',
    },
    {
      key: "DATEI",
      header: "تاريخ الإضافة",
      sortable: true,
      className: "text-xs",
      cell: (item) => formatDate(item.DATEI),
    },
    {
      key: "CIST",
      header: "الحالة",
      sortable: true,
      cell: (item) => (
        <div className="flex flex-col gap-1">
          <StatusBadge status={item.CIST === 1 ? 'active' : 'inactive'} />
          {item.CIST !== 1 && item.RES && (
            <span className="text-[10px] text-destructive truncate max-w-[120px]" title={item.RES}>
              {item.RES}
            </span>
          )}
        </div>
      ),
    },
    {
      key: "VALIDITY",
      header: "تاريخ التفعيل (من - إلى)",
      cell: (item) => (
        <div className="flex items-center gap-1 text-xs text-muted-foreground bg-muted/30 px-2 py-1 rounded-md">
          <Calendar className="w-3 h-3" />
          <span>{formatDate(item.CIFD, 'ar-YE')}</span>
          <span className="mx-1">→</span>
          <span>{formatDate(item.CITD, 'ar-YE')}</span>
        </div>
      ),
    },
    {
      key: "CINU",
      header: "الأجهزة",
      sortable: true,
      cell: (item) => (
        <span className="inline-flex items-center px-2 py-1 rounded-lg bg-muted text-xs font-medium">
          {item.CINU}
        </span>
      ),
    },
    {
      key: "CIDLM",
      header: "حد الرسائل",
      cell: (item) => <span className="text-xs font-medium">{item.CIDLM}</span>,
    },
    {
      key: "numberReadySessions",
      header: "الجلسات الفعالة",
      cell: (item) => <span className="text-xs font-medium text-success">{item.numberReadySessions || 0}</span>,
    },
    {
      key: "CIAF8",
      header: "الرسائل المرسلة",
      cell: (item) => <span className="text-xs font-medium">{item.CIAF8 || 0}</span>,
    },
    {
      key: "CIAF9",
      header: "آخر رسالة",
      className: "text-[10px]",
      cell: (item) => formatDateTime(item.CIAF9),
    },
    {
      key: "CIAF10",
      header: "النظام والاصدار",
      className: "text-xs",
      cell: (item) => item.CIAF10 || item.DEVI || '-',
    },
    {
      key: "CIMAN",
      header: "المسؤول",
      className: "text-xs",
      cell: (item) => item.CIMAN || '-',
    },
    {
      key: "CIORG",
      header: "CIORG",
      className: "font-mono text-[10px] text-muted-foreground",
    },
    {
      key: "ACTIONS",
      header: "الإجراءات",
      sticky: "left",
      cell: (item) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 text-right">
            <DropdownMenuItem className="gap-2 justify-end" onClick={() => onEdit(item)}>
              تعديل
              <Edit2 className="w-4 h-4" />
            </DropdownMenuItem>
            <DropdownMenuItem className="gap-2 justify-end" asChild>
              <Link to={`/dashboard/users?org=${item.CIID}`}>
                عرض الجلسات
                <Smartphone className="w-4 h-4" />
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem className="gap-2 text-destructive justify-end" onClick={() => onDelete(item.CIORG)}>
              حذف
              <Trash2 className="w-4 h-4" />
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];
