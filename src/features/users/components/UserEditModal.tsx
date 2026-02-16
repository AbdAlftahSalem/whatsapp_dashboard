import * as React from "react";
import { BaseModal } from "@/components/ui/BaseModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Save } from "lucide-react";

interface UserEditModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: any;
  onSubmit: (data: any) => Promise<void>;
  isSubmitting?: boolean;
}

export function UserEditModal({
  open,
  onOpenChange,
  user,
  onSubmit,
  isSubmitting = false,
}: UserEditModalProps) {
  const [formData, setFormData] = React.useState<any>(null);

  React.useEffect(() => {
    if (user) {
      setFormData({
        session_id: user.session_id,
        user_code: user.user_code,
        message_limit: user.message_limit || user.daily_limit || 100,
        customer_name: user.SOMNA || user.customer_name || '',
      });
    }
  }, [user]);

  if (!formData) return null;

  const handleSubmit = async () => {
    await onSubmit(formData);
  };

  return (
    <BaseModal
      open={open}
      onOpenChange={onOpenChange}
      title={`تعديل الجلسة: ${user?.session_id}`}
      description="تحديث إعدادات الجلسة والحدود اليومية"
      size="lg"
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
      <div className="space-y-4 py-4">
        <div className="space-y-2 text-right">
          <Label>اسم العميل / المؤسسة</Label>
          <Input 
            value={formData.customer_name} 
            onChange={e => setFormData({...formData, customer_name: e.target.value})} 
            readOnly
            className="bg-muted"
          />
        </div>
        <div className="space-y-2 text-right">
          <Label>حد الرسائل اليومي</Label>
          <Input 
            type="number"
            value={formData.message_limit} 
            onChange={e => setFormData({...formData, message_limit: parseInt(e.target.value)})} 
          />
        </div>
      </div>
    </BaseModal>
  );
}
