import { cn } from '@/lib/utils';
import { 
  Wifi, 
  WifiOff, 
  Loader2, 
  AlertCircle, 
  XCircle,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Server,
  Power,
  RotateCcw
} from 'lucide-react';

export type StatusType = 
  | 'active' | 'inactive' 
  | 'online' | 'offline' | 'restarting' | 'shutdown'
  | 'ready' | 'logout' | 'qr' | 'authenticated' | 'maxqrcodetries' | 'none'
  | 'info' | 'warning' | 'error' | 'critical'
  | 'open' | 'connecting' | 'close' | 'not_ready' | 'max_qr_tries';

interface StatusBadgeProps {
  status: StatusType | string;
  showIcon?: boolean;
  size?: 'sm' | 'md' | 'lg';
  label?: string; // override default label
  className?: string;
}

const statusConfig: Record<string, { label: string; className: string; icon: any }> = {
  // Session Status
  ready: { label: 'جاهز', className: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20', icon: Wifi },
  open: { label: 'جاهز', className: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20', icon: Wifi },
  active: { label: 'نشط', className: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20', icon: CheckCircle2 },
  authenticated: { label: 'متصل', className: 'bg-blue-500/10 text-blue-500 border-blue-500/20', icon: Loader2 },
  qr: { label: 'QR', className: 'bg-amber-500/10 text-amber-500 border-amber-500/20', icon: WifiOff },
  logout: { label: 'خروج', className: 'bg-rose-500/10 text-rose-500 border-rose-500/20', icon: XCircle },
  none: { label: 'غير محدد', className: 'bg-muted text-muted-foreground border-border', icon: WifiOff },
  maxqrcodetries: { label: 'تجاوز QR', className: 'bg-amber-500/10 text-amber-500 border-amber-500/20', icon: AlertTriangle },
  max_qr_tries: { label: 'تجاوز QR', className: 'bg-amber-500/10 text-amber-500 border-amber-500/20', icon: AlertTriangle },
  not_ready: { label: 'غير جاهز', className: 'bg-rose-500/10 text-rose-500 border-rose-500/20', icon: WifiOff },
  connecting: { label: 'جاري الاتصال', className: 'bg-amber-500/10 text-amber-500 border-amber-500/20', icon: Clock },
  close: { label: 'مغلق', className: 'bg-rose-500/10 text-rose-500 border-rose-500/20', icon: XCircle },
  inactive: { label: 'موقوف', className: 'bg-slate-500/10 text-slate-500 border-slate-500/20', icon: XCircle },

  // Server Status
  online: { label: 'متصل', className: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20', icon: Server },
  offline: { label: 'غير متصل', className: 'bg-rose-500/10 text-rose-500 border-rose-500/20', icon: Power },
  restarting: { label: 'إعادة تشغيل', className: 'bg-amber-500/10 text-amber-500 border-amber-500/20', icon: RotateCcw },
  shutdown: { label: 'توقف', className: 'bg-rose-700/10 text-rose-700 border-rose-700/20', icon: Power },

  // Log Levels / Generic
  info: { label: 'معلومات', className: 'bg-blue-500/10 text-blue-500 border-blue-500/20', icon: AlertCircle },
  warning: { label: 'تحذير', className: 'bg-amber-500/10 text-amber-500 border-amber-500/20', icon: AlertTriangle },
  error: { label: 'خطأ', className: 'bg-rose-500/10 text-rose-500 border-rose-500/20', icon: XCircle },
  critical: { label: 'حرج', className: 'bg-red-600/10 text-red-600 border-red-600/20', icon: AlertCircle },
};

export function StatusBadge({ status, showIcon = true, size = 'md', label, className }: StatusBadgeProps) {
  const s = String(status).toLowerCase();
  const config = statusConfig[s] || { label: status, className: 'bg-muted text-muted-foreground border-border', icon: AlertCircle };
  const Icon = config.icon;
  
  const sizeClasses = {
    sm: "px-1.5 py-0.5 text-[9px]",
    md: "px-2 py-0.5 text-[10px]",
    lg: "px-3 py-1 text-xs"
  };

  return (
    <span className={cn(
      "inline-flex items-center gap-1.5 rounded-full font-bold uppercase tracking-wider border transition-colors",
      config.className,
      sizeClasses[size],
      className
    )}>
      {showIcon && <Icon className={cn(
        size === 'sm' ? "w-2.5 h-2.5" : size === 'md' ? "w-3 h-3" : "w-3.5 h-3.5",
        s === 'authenticated' && "animate-spin"
      )} />}
      {label || config.label}
    </span>
  );
}
