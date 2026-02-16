import { motion } from 'framer-motion';
import { 
  Monitor, 
  Cpu, 
  HardDrive, 
  RefreshCw, 
  Activity, 
  Power, 
  Database,
  Globe,
  Clock,
  Settings,
  Shield,
  Trash2,
  Edit,
  Building2,
  Calendar,
  MoreVertical,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { ResourceUsage } from '@/components/ui/ResourceUsage';
import { Sparkline } from '@/components/charts/Sparkline';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

interface ServerCardProps {
  server: any;
  onEdit: (server: any) => void;
  onDelete: (id: number) => void;
  onRestart: (id: number) => void;
}

export function ServerCard({ server, onEdit, onDelete, onRestart }: ServerCardProps) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="premium-card group hover:shadow-2xl hover:shadow-primary/5 transition-all duration-500 border-primary/5"
    >
      {/* Top Section: Status & Actions */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className={cn(
            "w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner transition-colors duration-500",
            server.status === 'online' ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"
          )}>
            <Monitor className="w-6 h-6" />
          </div>
          <div>
             <div className="flex items-center gap-2">
               <h3 className="font-black text-lg tracking-tight text-foreground">{server.name}</h3>
               <StatusBadge status={server.status} size="sm" />
             </div>
             <div className="flex items-center gap-2 mt-0.5">
               <Globe className="w-3 h-3 text-muted-foreground/60" />
               <span className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest">{server.ip}</span>
             </div>
          </div>
        </div>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl hover:bg-muted opacity-0 group-hover:opacity-100 transition-opacity">
              <MoreVertical className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 p-2 rounded-xl">
            <DropdownMenuItem onClick={() => onEdit(server)} className="gap-2 rounded-lg font-bold text-xs">
              <Edit className="w-3.5 h-3.5" /> تعديل البيانات
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onRestart(server.id)} className="gap-2 rounded-lg font-bold text-xs text-success">
              <RefreshCw className="w-3.5 h-3.5" /> إعادة التشغيل
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onDelete(server.id)} className="gap-2 rounded-lg font-bold text-xs text-destructive">
              <Trash2 className="w-3.5 h-3.5" /> حذف الخادم
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Resource Metrics Grid */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-muted/30 p-3 rounded-2xl border border-border/50 space-y-3">
          <div className="flex items-center justify-between">
             <div className="flex items-center gap-2">
               <Cpu className="w-3.5 h-3.5 text-muted-foreground" />
               <span className="text-[10px] font-black uppercase tracking-wider">CPU</span>
             </div>
             <Sparkline data={server.history} dataKey="cpu" color={server.cpuUsage >= 80 ? '#ef4444' : '#22c55e'} />
          </div>
          <ResourceUsage 
            value={server.cpuUsage} 
            showPercentage 
            unit="%" 
            size="sm"
          />
        </div>
        
        <div className="bg-muted/30 p-3 rounded-2xl border border-border/50 space-y-3">
          <div className="flex items-center justify-between">
             <div className="flex items-center gap-2">
               <HardDrive className="w-3.5 h-3.5 text-muted-foreground" />
               <span className="text-[10px] font-black uppercase tracking-wider">RAM</span>
             </div>
             <Sparkline data={server.history} dataKey="ram" color={(server.ramUsage / (server.ramTotal || 1)) * 100 >= 80 ? '#ef4444' : '#3b82f6'} />
          </div>
          <ResourceUsage 
            value={server.ramUsage} 
            max={server.ramTotal || 100}
            showPercentage 
            unit="GB" 
            size="sm"
          />
        </div>
      </div>

      {/* Bottom Stats */}
      <div className="flex items-center justify-between pt-4 border-t border-border/50">
        <div className="flex items-center gap-4">
          <div className="space-y-0.5">
            <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest leading-none">الجلسات</p>
            <div className="flex items-baseline gap-1">
              <span className="text-sm font-black text-primary">{server.activeSessions}</span>
              <span className="text-[10px] text-muted-foreground">/ {server.maxSessions}</span>
            </div>
          </div>
          <div className="w-px h-6 bg-border/50" />
          <div className="space-y-0.5">
            <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest leading-none">النوع</p>
            <p className="text-[10px] font-black uppercase text-foreground">{server.type}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2 bg-muted/50 px-3 py-1.5 rounded-xl border border-border/50">
           <div className={cn("w-1.5 h-1.5 rounded-full", server.status === 'online' ? "bg-success animate-pulse" : "bg-muted-foreground")} />
           <span className="text-[10px] font-bold uppercase tracking-wider">{server.uptime || 'N/A'}</span>
        </div>
      </div>
    </motion.div>
  );
}
