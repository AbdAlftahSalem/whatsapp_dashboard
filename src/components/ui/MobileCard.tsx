import * as React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface MobileCardProps {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  icon?: React.ReactNode;
  actions?: React.ReactNode;
  status?: React.ReactNode;
  details?: React.ReactNode;
  footer?: React.ReactNode;
  stats?: React.ReactNode;
  className?: string;
  delay?: number;
}

export function MobileCard({
  title,
  subtitle,
  icon,
  actions,
  status,
  details,
  footer,
  stats,
  className,
  delay = 0,
}: MobileCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className={cn("bg-card rounded-xl border border-border p-4 space-y-3 shadow-sm", className)}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          {icon && (
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              {icon}
            </div>
          )}
          <div>
            <div className="font-medium text-foreground">{title}</div>
            {subtitle && <div className="text-xs text-muted-foreground">{subtitle}</div>}
          </div>
        </div>
        {actions}
      </div>

      {details && (
        <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
          {details}
        </div>
      )}

      {(status || footer) && (
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-border">
          <div className="flex flex-col gap-1">
            {footer}
          </div>
          <div className="flex flex-col items-end gap-1">
            {status}
          </div>
        </div>
      )}

      {stats && (
        <div className="grid grid-cols-3 gap-2 pt-2 text-[10px] text-center border-t border-border">
          {stats}
        </div>
      )}
    </motion.div>
  );
}

export function MobileCardStat({ label, value, className }: { label: string; value: React.ReactNode; className?: string }) {
  return (
    <div className={cn("bg-muted px-1 py-1 rounded", className)}>
      <p className="text-muted-foreground">{label}</p>
      <p className="font-bold">{value}</p>
    </div>
  );
}
