import * as React from "react";
import { Progress } from "./progress";
import { cn } from "@/lib/utils";

interface ResourceUsageProps {
  value: number | null;
  max?: number;
  label?: string;
  showPercentage?: boolean;
  showValue?: boolean;
  size?: 'sm' | 'md' | 'lg';
  colorThreshold?: { warning: number; danger: number };
  unit?: string;
  className?: string;
}

export function ResourceUsage({
  value,
  max = 100,
  label,
  showPercentage = true,
  showValue = false,
  size = 'md',
  colorThreshold = { warning: 60, danger: 80 },
  unit = '%',
  className,
}: ResourceUsageProps) {
  if (value === null || value === undefined) return null;

  const percentage = Math.min(Math.round((value / max) * 100), 100);
  
  const getColorClass = (perc: number) => {
    if (perc >= colorThreshold.danger) return "bg-rose-500";
    if (perc >= colorThreshold.warning) return "bg-amber-500";
    return "bg-emerald-500";
  };

  const getTextColorClass = (perc: number) => {
    if (perc >= colorThreshold.danger) return "text-rose-500";
    if (perc >= colorThreshold.warning) return "text-amber-500";
    return "text-emerald-500";
  };

  const heightClasses = {
    sm: "h-1",
    md: "h-1.5",
    lg: "h-2.5"
  };

  return (
    <div className={cn("space-y-1.5", className)}>
      {(label || showPercentage || showValue) && (
        <div className="flex items-center justify-between gap-2">
          {label && <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{label}</span>}
          <div className="flex items-center gap-1">
            {showValue && <span className="text-xs font-black">{value}</span>}
            {showPercentage && (
              <span className={cn("text-xs font-black", getTextColorClass(percentage))}>
                {percentage}{unit}
              </span>
            )}
          </div>
        </div>
      )}
      <div className={cn("w-full bg-muted/50 rounded-full overflow-hidden", heightClasses[size])}>
        <div 
          className={cn("h-full transition-all duration-500", getColorClass(percentage))}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
