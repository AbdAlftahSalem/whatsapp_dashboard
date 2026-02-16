import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowUpDown, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface Column<T> {
  key: string;
  header: string;
  cell?: (item: T, index: number) => React.ReactNode;
  sortable?: boolean;
  className?: string;
  sticky?: "left" | "right";
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  keyExtractor: (item: T, index: number) => string | number;
  isLoading?: boolean;
  onSort?: (key: string) => void;
  sortConfig?: { key: string; direction: "asc" | "desc" } | null;
  emptyMessage?: string;
  emptyIcon?: React.ReactNode;
  className?: string;
}

export function DataTable<T>({
  data,
  columns,
  keyExtractor,
  isLoading,
  onSort,
  sortConfig,
  emptyMessage = "لا توجد بيانات متاحة",
  emptyIcon,
  className,
}: DataTableProps<T>) {
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
        <p className="text-muted-foreground animate-pulse text-sm">جاري تحميل البيانات...</p>
      </div>
    );
  }

  return (
    <div className={cn("data-table overflow-hidden rounded-xl border border-border shadow-sm", className)}>
      <div className="overflow-x-auto">
        <table className="w-full whitespace-nowrap border-collapse">
          <thead>
            <tr className="bg-muted/50 border-b border-border">
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={cn(
                    "px-4 py-3 text-right text-xs font-semibold text-muted-foreground transition-colors",
                    column.sortable && "cursor-pointer hover:bg-muted/80 select-none",
                    column.sticky === "left" && "sticky left-0 bg-muted/50 backdrop-blur-sm z-10 border-r border-border",
                    column.sticky === "right" && "sticky right-0 bg-muted/50 backdrop-blur-sm z-10 border-l border-border",
                    column.className
                  )}
                  onClick={() => column.sortable && onSort?.(column.key)}
                  style={column.sticky === "left" ? { backgroundColor: 'oklch(96.8% 0.007 247.896)' } : undefined}
                >
                  <div className="flex items-center gap-1.5">
                    {column.header}
                    {column.sortable && (
                      <ArrowUpDown className={cn(
                        "w-3 h-3 transition-colors",
                        sortConfig?.key === column.key ? "text-primary" : "text-muted-foreground/30"
                      )} />
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border bg-card">
            <AnimatePresence mode="popLayout">
              {data.map((item, index) => (
                <motion.tr
                  key={keyExtractor(item, index)}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2, delay: index * 0.03 }}
                  className="hover:bg-muted/30 transition-colors group"
                >
                  {columns.map((column) => (
                    <td
                      key={column.key}
                      className={cn(
                        "px-4 py-3 text-sm transition-colors",
                        column.sticky === "left" && "sticky left-0 bg-background/95 backdrop-blur-sm group-hover:bg-muted/95 z-10 border-r border-border",
                        column.sticky === "right" && "sticky right-0 bg-background/95 backdrop-blur-sm group-hover:bg-muted/95 z-10 border-l border-border",
                        column.className
                      )}
                    >
                      {column.cell ? column.cell(item, index) : (item[column.key as keyof T] as React.ReactNode)}
                    </td>
                  ))}
                </motion.tr>
              ))}
            </AnimatePresence>
          </tbody>
        </table>
      </div>

      {data.length === 0 && (
        <div className="p-16 text-center bg-card">
          <div className="flex flex-col items-center justify-center space-y-4">
            {emptyIcon || <div className="p-4 rounded-full bg-muted/50 text-muted-foreground/30">
              <Loader2 className="w-8 h-8 opacity-20" />
            </div>}
            <div className="space-y-1">
              <h3 className="text-lg font-medium text-foreground">{emptyMessage}</h3>
              <p className="text-sm text-muted-foreground">لا توجد سجلات تطابق عوامل التصفية الحالية</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
