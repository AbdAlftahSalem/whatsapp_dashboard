import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'error' | 'destructive';
  className?: string;
}

const variantStyles = {
  default: 'bg-card border-border/50',
  primary: 'bg-primary/[0.02] border-primary/10',
  success: 'bg-emerald-500/[0.02] border-emerald-500/10',
  warning: 'bg-amber-500/[0.02] border-amber-500/10',
  error: 'bg-rose-500/[0.02] border-rose-500/10',
  destructive: 'bg-rose-500/[0.02] border-rose-500/10',
};

const iconVariantStyles = {
  default: 'bg-muted text-muted-foreground',
  primary: 'bg-primary/10 text-primary',
  success: 'bg-emerald-500/10 text-emerald-500',
  warning: 'bg-amber-500/10 text-amber-500',
  error: 'bg-rose-500/10 text-rose-500',
  destructive: 'bg-rose-500/10 text-rose-500',
};

export function StatsCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  variant = 'default',
  className,
}: StatsCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'stats-card group overflow-hidden relative',
        variantStyles[variant],
        className
      )}
    >
      <div className="flex items-start justify-between relative z-10">
        <div className="flex-1">
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">{title}</p>
          <p className="text-2xl font-black text-foreground tracking-tight">{value}</p>
          {subtitle && (
            <p className="text-xs text-muted-foreground mt-1 font-medium">{subtitle}</p>
          )}
          {trend && (
            <div className={cn(
              'flex items-center gap-1 mt-2 text-xs font-bold',
              trend.isPositive ? 'text-emerald-500' : 'text-rose-500'
            )}>
              <span className="text-[14px] leading-none">{trend.isPositive ? '↑' : '↓'}</span>
              <span>{Math.abs(trend.value)}%</span>
              <span className="text-muted-foreground font-normal text-[10px] mr-1">مقارنة بالسابق</span>
            </div>
          )}
        </div>
        <div className={cn(
          'w-11 h-11 rounded-xl flex items-center justify-center shrink-0 shadow-sm transition-transform group-hover:scale-110',
          iconVariantStyles[variant]
        )}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      
      {/* Subtle Background Glow */}
      <div className={cn(
        "absolute -bottom-6 -left-6 w-24 h-24 blur-3xl rounded-full opacity-20 transition-opacity group-hover:opacity-30",
        variant === 'primary' ? 'bg-primary' : 
        variant === 'success' ? 'bg-emerald-500' : 
        variant === 'warning' ? 'bg-amber-500' : 
        variant === 'error' || variant === 'destructive' ? 'bg-rose-500' : 'bg-muted'
      )} />
    </motion.div>
  );
}
