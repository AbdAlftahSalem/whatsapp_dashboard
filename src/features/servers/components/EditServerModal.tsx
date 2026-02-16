import * as React from "react";
import { BaseModal } from "@/components/ui/BaseModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Save } from "lucide-react";

interface EditServerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  server: any;
  onSubmit: (data: any) => Promise<void>;
  isSubmitting?: boolean;
}

export function EditServerModal({
  open,
  onOpenChange,
  server,
  onSubmit,
  isSubmitting = false,
}: EditServerModalProps) {
  const [formData, setFormData] = React.useState<any>(null);

  React.useEffect(() => {
    if (server) {
      setFormData({ ...server });
    }
  }, [server]);

  if (!formData) return null;

  const handleSubmit = async () => {
    await onSubmit(formData);
  };

  return (
    <BaseModal
      open={open}
      onOpenChange={onOpenChange}
      title={`تعديل الخادم: ${server?.name}`}
      description="تحديث إعدادات وبيانات الخادم"
      size="2xl"
      footer={
        <div className="flex items-center gap-2 w-full justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            إلغاء
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting} className="gap-2">
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            حفظ التغييرات
          </Button>
        </div>
      }
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2 text-right">
          <Label>اسم الخادم</Label>
          <Input 
            value={formData.name || ''} 
            onChange={e => setFormData({...formData, name: e.target.value})} 
          />
        </div>
        <div className="space-y-2 text-right">
          <Label>عنوان IP</Label>
          <Input 
            value={formData.ip || ''} 
            onChange={e => setFormData({...formData, ip: e.target.value})} 
            dir="ltr"
          />
        </div>
        <div className="space-y-2 text-right">
          <Label>المنفذ</Label>
          <Input 
            value={formData.port || ''} 
            onChange={e => setFormData({...formData, port: e.target.value})} 
            dir="ltr"
          />
        </div>
        <div className="space-y-2 text-right">
           <Label>الموقع</Label>
           <Input 
             value={formData.location || ''} 
             onChange={e => setFormData({...formData, location: e.target.value})} 
           />
        </div>
      </div>
    </BaseModal>
  );
}
