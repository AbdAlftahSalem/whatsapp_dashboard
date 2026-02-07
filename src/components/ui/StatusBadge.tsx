import { cn } from '@/lib/utils';

type Status = 'authenticated' | 'close' | 'open' | 'connecting' | 'active' | 'inactive' | 'ready';

interface StatusBadgeProps {
  status: Status;
  className?: string;
}

const statusConfig: Record<Status, { label: string; className: string }> = {
  authenticated: { label: 'متصل', className: 'badge-success' },
  open: { label: 'جاهز', className: 'badge-success' },
  ready: { label: 'جاهز', className: 'badge-success' },
  connecting: { label: 'جاري الاتصال', className: 'badge-warning' },
  close: { label: 'غير متصل', className: 'badge-error' },
  active: { label: 'نشط', className: 'badge-success' },
  inactive: { label: 'غير نشط', className: 'badge-neutral' },
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status] || statusConfig.inactive;
  
  return (
    <span className={cn(config.className, className)}>
      {config.label}
    </span>
  );
}
