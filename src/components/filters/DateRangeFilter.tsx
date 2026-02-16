import * as React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface DateRangeFilterProps {
  dateFrom: string;
  dateTo: string;
  onDateFromChange: (value: string) => void;
  onDateToChange: (value: string) => void;
  onQuickSelect?: (period: 'today' | 'week' | 'month') => void;
  label?: string;
}

export function DateRangeFilter({
  dateFrom,
  dateTo,
  onDateFromChange,
  onDateToChange,
  onQuickSelect,
  label = "تاريخ الإضافة",
}: DateRangeFilterProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-xs font-semibold">{label}</Label>
        {onQuickSelect && (
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" onClick={() => onQuickSelect('today')} className="text-[10px] h-6 px-2">اليوم</Button>
            <Button variant="ghost" size="sm" onClick={() => onQuickSelect('week')} className="text-[10px] h-6 px-2">أسبوع</Button>
            <Button variant="ghost" size="sm" onClick={() => onQuickSelect('month')} className="text-[10px] h-6 px-2">شهر</Button>
          </div>
        )}
      </div>
      <div className="flex items-center gap-2">
        <Input
          type="date"
          value={dateFrom}
          onChange={(e) => onDateFromChange(e.target.value)}
          className="h-9 text-xs"
        />
        <Input
          type="date"
          value={dateTo}
          onChange={(e) => onDateToChange(e.target.value)}
          className="h-9 text-xs"
        />
      </div>
    </div>
  );
}
