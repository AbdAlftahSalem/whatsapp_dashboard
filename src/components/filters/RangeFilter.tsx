import * as React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

interface RangeFilterProps {
  from: string;
  to: string;
  onFromChange: (value: string) => void;
  onToChange: (value: string) => void;
  fromPlaceholder?: string;
  toPlaceholder?: string;
  label?: string;
}

export function RangeFilter({
  from,
  to,
  onFromChange,
  onToChange,
  fromPlaceholder = "من",
  toPlaceholder = "إلى",
  label,
}: RangeFilterProps) {
  return (
    <div className="space-y-2">
      {label && <Label className="text-xs font-semibold">{label}</Label>}
      <div className="flex items-center gap-2">
        <Input
          placeholder={fromPlaceholder}
          value={from}
          onChange={(e) => onFromChange(e.target.value)}
          className="h-9 text-xs"
        />
        <Input
          placeholder={toPlaceholder}
          value={to}
          onChange={(e) => onToChange(e.target.value)}
          className="h-9 text-xs"
        />
      </div>
    </div>
  );
}
