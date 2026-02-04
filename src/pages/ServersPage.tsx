import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Server,
  Plus,
  Search,
  MoreVertical,
  RefreshCw,
  Trash2,
  Edit,
  Cpu,
  HardDrive,
  Activity,
  Power,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';

interface ServerData {
  id: number;
  name: string;
  ip: string;
  status: 'online' | 'offline' | 'restarting';
  cpuUsage: number;
  ramUsage: number;
  ramTotal: number;
  uptime: string;
  location: string;
}

// Mock data
const mockServers: ServerData[] = [
  { id: 1, name: 'الخادم الرئيسي', ip: '192.168.1.100', status: 'online', cpuUsage: 45, ramUsage: 8, ramTotal: 16, uptime: '45 يوم', location: 'الرياض' },
  { id: 2, name: 'خادم الرسائل', ip: '192.168.1.101', status: 'online', cpuUsage: 72, ramUsage: 12, ramTotal: 16, uptime: '30 يوم', location: 'جدة' },
  { id: 3, name: 'خادم النسخ الاحتياطي', ip: '192.168.1.102', status: 'offline', cpuUsage: 0, ramUsage: 0, ramTotal: 8, uptime: '-', location: 'الدمام' },
  { id: 4, name: 'خادم الواتساب 1', ip: '192.168.1.103', status: 'online', cpuUsage: 58, ramUsage: 6, ramTotal: 8, uptime: '15 يوم', location: 'الرياض' },
  { id: 5, name: 'خادم الواتساب 2', ip: '192.168.1.104', status: 'restarting', cpuUsage: 0, ramUsage: 4, ramTotal: 8, uptime: '-', location: 'جدة' },
];

export default function ServersPage() {
  const [servers, setServers] = useState<ServerData[]>(mockServers);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedServer, setSelectedServer] = useState<ServerData | null>(null);
  const [newServer, setNewServer] = useState({ name: '', ip: '', location: '' });
  const { toast } = useToast();

  const filteredServers = servers.filter(
    (server) =>
      server.name.includes(searchQuery) ||
      server.ip.includes(searchQuery) ||
      server.location.includes(searchQuery)
  );

  const handleAddServer = () => {
    const server: ServerData = {
      id: Date.now(),
      name: newServer.name,
      ip: newServer.ip,
      status: 'offline',
      cpuUsage: 0,
      ramUsage: 0,
      ramTotal: 8,
      uptime: '-',
      location: newServer.location,
    };
    setServers([...servers, server]);
    setNewServer({ name: '', ip: '', location: '' });
    setIsAddModalOpen(false);
    toast({ title: 'تم إضافة الخادم بنجاح' });
  };

  const handleEditServer = () => {
    if (!selectedServer) return;
    setServers(servers.map(s => s.id === selectedServer.id ? selectedServer : s));
    setIsEditModalOpen(false);
    toast({ title: 'تم تحديث الخادم بنجاح' });
  };

  const handleDeleteServer = (id: number) => {
    setServers(servers.filter(s => s.id !== id));
    toast({ title: 'تم حذف الخادم', variant: 'destructive' });
  };

  const handleRestartServer = (id: number) => {
    setServers(servers.map(s => s.id === id ? { ...s, status: 'restarting' as const } : s));
    toast({ title: 'جاري إعادة تشغيل الخادم...' });
    setTimeout(() => {
      setServers(prev => prev.map(s => s.id === id ? { ...s, status: 'online' as const } : s));
      toast({ title: 'تم إعادة تشغيل الخادم بنجاح' });
    }, 3000);
  };

  const handleRestartAll = () => {
    setServers(servers.map(s => ({ ...s, status: 'restarting' as const })));
    toast({ title: 'جاري إعادة تشغيل جميع الخوادم...' });
    setTimeout(() => {
      setServers(prev => prev.map(s => ({ ...s, status: 'online' as const })));
      toast({ title: 'تم إعادة تشغيل جميع الخوادم بنجاح' });
    }, 5000);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'online': return <CheckCircle className="w-4 h-4 text-success" />;
      case 'offline': return <XCircle className="w-4 h-4 text-destructive" />;
      case 'restarting': return <RefreshCw className="w-4 h-4 text-warning animate-spin" />;
      default: return null;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'online': return 'متصل';
      case 'offline': return 'غير متصل';
      case 'restarting': return 'جاري الإعادة';
      default: return status;
    }
  };

  const getCpuColor = (usage: number) => {
    if (usage >= 80) return 'text-destructive';
    if (usage >= 60) return 'text-warning';
    return 'text-success';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-foreground">إدارة الخوادم</h1>
          <p className="text-sm text-muted-foreground mt-1">مراقبة وإدارة خوادم النظام</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleRestartAll}>
            <RefreshCw className="w-4 h-4 ml-2" />
            إعادة تشغيل الكل
          </Button>
          <Button onClick={() => setIsAddModalOpen(true)}>
            <Plus className="w-4 h-4 ml-2" />
            إضافة خادم
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="البحث عن خادم..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pr-10"
        />
      </div>

      {/* Server Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredServers.map((server) => (
          <motion.div
            key={server.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="stats-card"
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Server className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">{server.name}</h3>
                  <p className="text-xs text-muted-foreground" dir="ltr">{server.ip}</p>
                </div>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => { setSelectedServer(server); setIsEditModalOpen(true); }}>
                    <Edit className="w-4 h-4 ml-2" />
                    تعديل
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleRestartServer(server.id)}>
                    <RefreshCw className="w-4 h-4 ml-2" />
                    إعادة تشغيل
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="text-destructive"
                    onClick={() => handleDeleteServer(server.id)}
                  >
                    <Trash2 className="w-4 h-4 ml-2" />
                    حذف
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Status */}
            <div className="flex items-center gap-2 mb-4">
              {getStatusIcon(server.status)}
              <span className="text-sm">{getStatusLabel(server.status)}</span>
              <span className="text-xs text-muted-foreground mr-auto">{server.location}</span>
            </div>

            {/* CPU Usage */}
            <div className="space-y-2 mb-3">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-muted-foreground" />
                  <span>CPU</span>
                </div>
                <span className={getCpuColor(server.cpuUsage)}>{server.cpuUsage}%</span>
              </div>
              <Progress value={server.cpuUsage} className="h-2" />
            </div>

            {/* RAM Usage */}
            <div className="space-y-2 mb-3">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <HardDrive className="w-4 h-4 text-muted-foreground" />
                  <span>RAM</span>
                </div>
                <span>{server.ramUsage}GB / {server.ramTotal}GB</span>
              </div>
              <Progress value={(server.ramUsage / server.ramTotal) * 100} className="h-2" />
            </div>

            {/* Uptime */}
            <div className="flex items-center justify-between text-sm pt-3 border-t border-border">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Activity className="w-4 h-4" />
                <span>مدة التشغيل</span>
              </div>
              <span className="font-medium">{server.uptime}</span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Add Server Modal */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>إضافة خادم جديد</DialogTitle>
            <DialogDescription>أدخل معلومات الخادم الجديد</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>اسم الخادم</Label>
              <Input
                value={newServer.name}
                onChange={(e) => setNewServer({ ...newServer, name: e.target.value })}
                placeholder="مثال: خادم الرسائل"
              />
            </div>
            <div className="space-y-2">
              <Label>عنوان IP</Label>
              <Input
                value={newServer.ip}
                onChange={(e) => setNewServer({ ...newServer, ip: e.target.value })}
                placeholder="192.168.1.100"
                dir="ltr"
              />
            </div>
            <div className="space-y-2">
              <Label>الموقع</Label>
              <Input
                value={newServer.location}
                onChange={(e) => setNewServer({ ...newServer, location: e.target.value })}
                placeholder="مثال: الرياض"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddModalOpen(false)}>إلغاء</Button>
            <Button onClick={handleAddServer}>إضافة</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Server Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>تعديل الخادم</DialogTitle>
            <DialogDescription>تحديث معلومات الخادم</DialogDescription>
          </DialogHeader>
          {selectedServer && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>اسم الخادم</Label>
                <Input
                  value={selectedServer.name}
                  onChange={(e) => setSelectedServer({ ...selectedServer, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>عنوان IP</Label>
                <Input
                  value={selectedServer.ip}
                  onChange={(e) => setSelectedServer({ ...selectedServer, ip: e.target.value })}
                  dir="ltr"
                />
              </div>
              <div className="space-y-2">
                <Label>الموقع</Label>
                <Input
                  value={selectedServer.location}
                  onChange={(e) => setSelectedServer({ ...selectedServer, location: e.target.value })}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>إلغاء</Button>
            <Button onClick={handleEditServer}>حفظ</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
