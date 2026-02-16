import * as React from "react";
import { MoreHorizontal, Edit2, RefreshCw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Column } from "@/components/ui/DataTable";
import { Progress } from "@/components/ui/progress";
import { Sparkline } from "@/components/charts/Sparkline";

interface ServerColumnsProps {
  onEdit: (server: any) => void;
  onRestart: (id: number) => void;
  onDelete: (server: any) => void;
}

export const getServerColumns = ({
  onEdit,
  onRestart,
  onDelete,
}: ServerColumnsProps): Column<any>[] => [
  {
    key: "id",
    header: "معرف",
    sortable: true,
    className: "font-mono text-xs",
  },
  {
    key: "name",
    header: "اسم الخادم",
    sortable: true,
    cell: (item) => (
      <div className="flex flex-col">
        <span className="font-bold text-sm tracking-tight">{item.name}</span>
        <span className="text-[10px] text-muted-foreground uppercase tracking-widest">{item.type}</span>
      </div>
    ),
  },
  {
    key: "status",
    header: "الحالة",
    sortable: true,
    cell: (item) => <StatusBadge status={item.status} />,
  },
  {
    key: "ip",
    header: "عنوان IP",
    cell: (item) => (
      <div className="flex flex-col font-mono text-xs">
        <span>{item.ip}</span>
        <span className="text-[10px] text-muted-foreground">Port: {item.port}</span>
      </div>
    ),
  },
  {
    key: "activeSessions",
    header: "الجلسات",
    sortable: true,
    cell: (item) => (
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between text-[10px] font-bold">
          <span>{item.activeSessions}</span>
          <span className="text-muted-foreground">/ {item.maxSessions}</span>
        </div>
        <Progress value={(item.activeSessions / item.maxSessions) * 100} className="h-1" />
      </div>
    ),
  },
  {
    key: "cpuUsage",
    header: "CPU",
    sortable: true,
    cell: (item) => item.cpuUsage !== null ? (
      <div className="flex items-center gap-3">
        <Sparkline data={item.history || []} color={item.cpuUsage >= 80 ? '#ef4444' : '#22c55e'} dataKey="cpu" />
        <div className="flex flex-col">
          <span className={`text-xs font-black ${item.cpuUsage >= 80 ? 'text-destructive' : 'text-success'}`}>
            {item.cpuUsage}%
          </span>
          <span className="text-[9px] text-muted-foreground uppercase">Usage</span>
        </div>
      </div>
    ) : '-',
  },
  {
    key: "ramUsage",
    header: "RAM",
    sortable: true,
    cell: (item) => item.ramUsage !== null ? (
      <div className="flex items-center gap-3">
        <Sparkline data={item.history || []} color={(item.ramUsage / (item.ramTotal || 1)) * 100 >= 80 ? '#ef4444' : '#3b82f6'} dataKey="ram" />
        <div className="flex flex-col">
          <span className="text-xs font-black text-primary">
            {item.ramUsage.toFixed(1)} GB
          </span>
          <span className="text-[9px] text-muted-foreground uppercase">
            of {item.ramTotal?.toFixed(0)} GB
          </span>
        </div>
      </div>
    ) : '-',
  },
  {
    key: "location",
    header: "الموقع والكود",
    cell: (item) => (
      <div className="flex flex-col">
        <span className="text-xs font-medium">{item.location || '-'}</span>
        <span className="text-[10px] font-mono text-muted-foreground uppercase">{item.code}</span>
      </div>
    ),
  },
  {
    key: "lastCheck",
    header: "آخر فحص",
    className: "text-[10px]",
    cell: (item) => item.lastCheck || '-',
  },
  {
    key: "ACTIONS",
    header: "إجراءات",
    sticky: "left",
    cell: (item) => (
      <div className="flex items-center gap-1 justify-end">
        <Button variant="ghost" size="icon" className="h-8 w-8 text-primary group" onClick={() => onEdit(item)}>
          <Edit2 className="w-4 h-4" />
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-success" onClick={() => onRestart(item.id)}>
          <RefreshCw className="w-4 h-4" />
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive px-0" onClick={() => onDelete(item)}>
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    ),
  },
];
