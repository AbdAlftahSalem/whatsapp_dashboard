import { Search, Filter, X } from "lucide-react";
import { Input } from "./input";
import { Button } from "./button";

interface SearchFilterBarProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  showAdvancedFilters?: boolean;
  onToggleAdvancedFilters?: () => void;
  setShowAdvancedFilters?: (show: boolean) => void; // Support direct setter
  filterButtonText?: string;
  children?: React.ReactNode;
}

export function SearchFilterBar({
  searchQuery,
  onSearchChange,
  searchPlaceholder = "البحث...",
  showAdvancedFilters = false,
  onToggleAdvancedFilters,
  setShowAdvancedFilters,
  filterButtonText = "تصفية متقدمة",
  children,
}: SearchFilterBarProps) {
  const handleToggle = () => {
    if (onToggleAdvancedFilters) {
      onToggleAdvancedFilters();
    } else if (setShowAdvancedFilters) {
      setShowAdvancedFilters(!showAdvancedFilters);
    }
  };

  const hasToggle = !!onToggleAdvancedFilters || !!setShowAdvancedFilters;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder={searchPlaceholder}
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pr-10 h-10 lg:h-11 rounded-xl shadow-sm border-border/60 focus-visible:ring-primary/20"
          />
        </div>
        
        {hasToggle && (
          <Button
            variant={showAdvancedFilters ? "default" : "outline"}
            className="gap-2 h-10 lg:h-11 rounded-xl px-5 border-border/60 shadow-sm transition-all active:scale-95"
            onClick={handleToggle}
          >
            <Filter className="w-4 h-4" />
            {filterButtonText}
          </Button>
        )}
      </div>

      {showAdvancedFilters && children}
    </div>
  );
}
