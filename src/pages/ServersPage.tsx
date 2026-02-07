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
  Loader2,
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
import { useQuery } from '@tanstack/react-query';
import { getServers } from '@/lib/api';

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

export default function ServersPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedServer, setSelectedServer] = useState<ServerData | null>(null);
  const [newServer, setNewServer] = useState({ name: '', ip: '', location: '' });
  const { toast } = useToast();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['servers'],
    queryFn: getServers,
  });

  const rawServers = data?.data?.servers || [];
  
  // Transform API data to match ServerData interface, keeping CPU/RAM as mock values
  const servers: ServerData[] = rawServers.map((s, index) => ({
    id: s.SISEQ,
    name: s.SISN,
    ip: s.SIIP,
    status: s.SIST === 1 ? 'online' : 'offline',
    // Keep CPU and RAM as mock values as requested
    cpuUsage: [45, 72, 0, 58, 0][index % 5],
    ramUsage: [8, 12, 0, 6, 4][index % 5],
    ramTotal: [16, 16, 8, 8, 8][index % 5],
    uptime: ['45 يوم', '30 يوم', '-', '15 يوم', '-'][index % 5],
    location: ['الرياض', 'جدة', 'الدمام', 'الرياض', 'جدة'][index % 5],
  }));

  const filteredServers = servers.filter(
    (server) =>
      server.name.includes(searchQuery) ||
      server.ip.includes(searchQuery) ||
      server.location.includes(searchQuery)
  );

  const handleAddServer = () => {
    // In a real app, this would be an API call
    toast({ title: 'ميزة إضافة خادم ستتوفر قريباً عبر الـ API' });
    setIsAddModalOpen(false);
  };

  const handleEditServer = () => {
    // In a real app, this would be an API call
    toast({ title: 'ميزة تعديل خادم ستتوفر قريباً عبر الـ API' });
    setIsEditModalOpen(false);
  };

  const handleDeleteServer = (id: number) => {
    // In a real app, this would be an API call
    toast({ title: 'ميزة حذف خادم ستتوفر قريباً عبر الـ API', variant: 'destructive' });
  };

  const handleRestartServer = (id: number) => {
    // In a real app, this would be an API call
    toast({ title: 'جاري إرسال طلب إعادة التشغيل...' });
  };

  const handleRestartAll = () => {
    // In a real app, this would be an API call
    toast({ title: 'جاري إرسال طلب إعادة تشغيل جميع الخوادم...' });
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

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
        <p className="text-muted-foreground animate-pulse">جاري تحميل بيانات الخوادم...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4 text-center">
        <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
          <XCircle className="w-6 h-6 text-destructive" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-foreground">فشل تحميل بيانات الخوادم</h3>
          <p className="text-sm text-muted-foreground mt-1">يرجى التحقق من اتصالك بالخادم والمحاولة مرة أخرى</p>
          <Button variant="outline" onClick={() => refetch()} className="mt-4">
            تحميل مرة أخرى
          </Button>
        </div>
      </div>
    );
  }

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

        {filteredServers.length === 0 && (
          <div className="col-span-full p-12 text-center bg-card rounded-xl border border-border">
            <Server className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground">لا توجد نتائج</p>
          </div>
        )}
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
