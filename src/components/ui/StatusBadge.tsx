import { cn } from '@/lib/utils';
import { 
  Wifi, 
  WifiOff, 
  Loader2, 
  AlertCircle, 
  XCircle,
  Clock
} from 'lucide-react';

export type Status = 
  | 'authenticated' 
  | 'close' 
  | 'open' 
  | 'connecting' 
  | 'active' 
  | 'inactive' 
  | 'ready'
  | 'not_ready'
  | 'qr'
  | 'logout'
  | 'none'
  | 'max_qr_tries';

interface StatusBadgeProps {
  status: Status;
  className?: string;
}

const statusConfig: Record<string, { label: string; className: string; icon: any }> = {
  ready: { label: 'Ready', className: 'bg-success/10 text-success border-success/20', icon: Wifi },
  not_ready: { label: 'Not Ready', className: 'bg-destructive/10 text-destructive border-destructive/20', icon: WifiOff },
  authenticated: { label: 'authenticated', className: 'bg-blue-500/10 text-blue-500 border-blue-500/20', icon: Loader2 },
  qr: { label: 'QR', className: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20', icon: WifiOff },
  logout: { label: 'logout', className: 'bg-destructive/10 text-destructive border-destructive/20', icon: AlertCircle },
  none: { label: 'none', className: 'bg-muted text-muted-foreground border-border', icon: WifiOff },
  max_qr_tries: { label: 'MaxQrcodeTries', className: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20', icon: WifiOff },
  open: { label: 'Ready', className: 'bg-success/10 text-success border-success/20', icon: Wifi },
  active: { label: 'Active', className: 'bg-success/10 text-success border-success/20', icon: Wifi },
  inactive: { label: 'Inactive', className: 'bg-muted text-muted-foreground border-border', icon: XCircle },
  connecting: { label: 'Connecting', className: 'bg-warning/10 text-warning border-warning/20', icon: Clock },
  close: { label: 'logout', className: 'bg-destructive/10 text-destructive border-destructive/20', icon: XCircle },
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status] || statusConfig.none;
  const Icon = config.icon;
  
  return (
    <span className={cn(
      "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium border transition-colors",
      config.className, 
      className
    )}>
      <Icon className={cn("w-3 h-3", status === 'authenticated' && "animate-spin")} />
      {config.label}
    </span>
  );
}
