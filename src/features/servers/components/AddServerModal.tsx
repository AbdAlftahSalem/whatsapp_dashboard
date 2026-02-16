import * as React from "react";
import { BaseModal } from "@/components/ui/BaseModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Plus } from "lucide-react";

interface AddServerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: any) => Promise<void>;
  isSubmitting?: boolean;
}

export function AddServerModal({
  open,
  onOpenChange,
  onSubmit,
  isSubmitting = false,
}: AddServerModalProps) {
  const [formData, setFormData] = React.useState({
    SISN: '',
    SITY: 'NORMAL',
    SIIP: '',
    SIPO: '5021',
    SIPT: 'HTTP',
    SIST: 1,
    SIRM: 'N',
    SIRT: 'PATH',
    SIMS: '250',
    SIAUY: '2',
    SIWE: '1',
    SITMS: '15000',
    SIMC: '100',
    SIDE: '',
    SIAF1: '',
    SIAF2: '',
  });

  const handleSubmit = async () => {
    await onSubmit(formData);
  };

  return (
    <BaseModal
      open={open}
      onOpenChange={onOpenChange}
      title="إضافة خادم جديد"
      description="أدخل تفاصيل الخادم الجديد للربط بالنظام"
      size="2xl"
      footer={
        <div className="flex items-center gap-2 w-full justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            إلغاء
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting} className="gap-2">
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            إضافة الخادم
          </Button>
        </div>
      }
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Same fields as in ServersPage.tsx */}
        <div className="space-y-2 text-right">
          <Label>رمز الخادم (SISN)</Label>
          <Input 
            value={formData.SISN} 
            onChange={e => setFormData({...formData, SISN: e.target.value})} 
            placeholder="مثال: SER-01"
          />
        </div>
        <div className="space-y-2 text-right">
          <Label>نوع الخدمة (SITY)</Label>
          <Select value={formData.SITY} onValueChange={v => setFormData({...formData, SITY: v})}>
             <SelectTrigger><SelectValue /></SelectTrigger>
             <SelectContent dir="rtl">
                <SelectItem value="NORMAL">NORMAL (خادم عام)</SelectItem>
                <SelectItem value="EMA_v2">EMA (إرسال فقط)</SelectItem>
                <SelectItem value="FGA">FGA (بوابة تدفق)</SelectItem>
             </SelectContent>
          </Select>
        </div>
        <div className="space-y-2 text-right">
          <Label>عنوان IP (SIIP)</Label>
          <Input 
            value={formData.SIIP} 
            onChange={e => setFormData({...formData, SIIP: e.target.value})} 
            placeholder="0.0.0.0" 
            dir="ltr"
          />
        </div>
        <div className="space-y-2 text-right">
          <Label>المنفذ (SIPO)</Label>
          <Input 
            value={formData.SIPO} 
            onChange={e => setFormData({...formData, SIPO: e.target.value})} 
            placeholder="5021" 
            dir="ltr"
          />
        </div>
        {/* ... More fields can be added here ... */}
      </div>
    </BaseModal>
  );
}
