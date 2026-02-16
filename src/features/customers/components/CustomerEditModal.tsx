import * as React from "react";
import { BaseModal } from "@/components/ui/BaseModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Save } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface CustomerEditModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer: any;
  onSubmit: (data: any) => Promise<void>;
  isSubmitting?: boolean;
}

export function CustomerEditModal({
  open,
  onOpenChange,
  customer,
  onSubmit,
  isSubmitting = false,
}: CustomerEditModalProps) {
  const [formData, setFormData] = React.useState<any>(null);

  React.useEffect(() => {
    if (customer) {
      setFormData({
        CISEQ: customer.CISEQ,
        nameA: customer.CINA || '',
        nameE: customer.CINE || '',
        status: customer.CIST || 1,
        detail: customer.SIDE || '',
        email: customer.CIEM || '',
        phone: customer.CIPH1 || '',
        address: customer.CIAD || '',
        country: customer.CICO || '',
        lan: customer.CILAN || 'ar',
        branch: customer.CIAF1 || 'الرئيسي',
        dlm: customer.CIDLM || 0,
        cinu: customer.CINU || 1,
        system: customer.CIAF10 || '',
        cifd: customer.CIFD ? customer.CIFD.split('T')[0] : '',
        citd: customer.CITD ? customer.CITD.split('T')[0] : '',
        af2: customer.CIAF2 || '',
        af3: customer.CIAF3 || '',
        af4: customer.CIAF4 || '',
        af5: customer.CIAF5 || '',
        mman: customer.CIMAN || '',
      });
    }
  }, [customer]);

  if (!formData) return null;

  const handleSubmit = async () => {
    await onSubmit(formData);
  };

  return (
    <BaseModal
      open={open}
      onOpenChange={onOpenChange}
      title={`تعديل بيانات العميل: ${customer?.CINA || customer?.CINE}`}
      description="قم بتحديث بيانات العميل وإعدادات النظام الخاصة به"
      size="4xl"
      footer={
        <div className="flex items-center gap-2 w-full justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            إلغاء
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting} className="min-w-[120px] gap-2">
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                جاری الحفظ...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                حفظ التغييرات
              </>
            )}
          </Button>
        </div>
      }
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-4">
        {/* Basic Info */}
        <div className="space-y-4 border-b md:border-b-0 md:border-l pb-4 md:pb-0 md:pl-4">
          <h4 className="font-semibold text-sm text-primary">المعلومات الأساسية</h4>
          <div className="space-y-2 text-right">
            <Label>الاسم بالعربي (CINA)</Label>
            <Input
              value={formData.nameA}
              onChange={(e) => setFormData({ ...formData, nameA: e.target.value })}
            />
          </div>
          <div className="space-y-2 text-right">
            <Label>الاسم بالإنجليزي (CINE)</Label>
            <Input
              value={formData.nameE}
              onChange={(e) => setFormData({ ...formData, nameE: e.target.value })}
              dir="ltr"
            />
          </div>
          <div className="space-y-2 text-right">
            <Label>الحالة (CIST)</Label>
            <Select 
              value={String(formData.status)} 
              onValueChange={(v) => setFormData({ ...formData, status: parseInt(v) })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent dir="rtl">
                <SelectItem value="1">فعال</SelectItem>
                <SelectItem value="2">موقوف</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2 text-right">
            <Label>التفاصيل / الملاحظات</Label>
            <Input
              value={formData.detail}
              onChange={(e) => setFormData({ ...formData, detail: e.target.value })}
            />
          </div>
        </div>

        {/* Contact Info */}
        <div className="space-y-4 border-b md:border-b-0 md:border-l pb-4 md:pb-0 md:pl-4">
          <h4 className="font-semibold text-sm text-primary">الاتصال والموقع</h4>
          <div className="space-y-2 text-right">
            <Label>البريد الإلكتروني</Label>
            <Input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              dir="ltr"
            />
          </div>
          <div className="space-y-2 text-right">
            <Label>رقم الهاتف</Label>
            <Input
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              dir="ltr"
            />
          </div>
          <div className="space-y-2 text-right">
            <Label>العنوان</Label>
            <Input
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-2 text-right">
              <Label>الدولة</Label>
              <Input
                value={formData.country}
                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
              />
            </div>
            <div className="space-y-2 text-right">
              <Label>اللغة</Label>
              <Select value={formData.lan} onValueChange={(v) => setFormData({ ...formData, lan: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent dir="rtl">
                  <SelectItem value="ar">العربية</SelectItem>
                  <SelectItem value="en">الإنجليزية</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* System Info */}
        <div className="space-y-4">
          <h4 className="font-semibold text-sm text-primary">إعدادات النظام</h4>
          <div className="space-y-2 text-right">
            <Label>الفرع (AF1)</Label>
            <Input
              value={formData.branch}
              onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-2 text-right">
              <Label>حد الرسائل اليومي</Label>
              <Input
                type="number"
                value={formData.dlm}
                onChange={(e) => setFormData({ ...formData, dlm: parseInt(e.target.value) || 0 })}
              />
            </div>
            <div className="space-y-2 text-right">
              <Label>الأجهزة المصرحة</Label>
              <Input
                type="number"
                min="1"
                value={formData.cinu}
                onChange={(e) => setFormData({ ...formData, cinu: parseInt(e.target.value) || 1 })}
              />
            </div>
          </div>
          <div className="space-y-2 text-right">
            <Label>النظام (AF10)</Label>
            <Input
              value={formData.system}
              onChange={(e) => setFormData({ ...formData, system: e.target.value })}
            />
          </div>
          <div className="space-y-2 text-right">
            <Label>بيانات المسؤول (CIMAN)</Label>
            <Input
              value={formData.mman}
              onChange={(e) => setFormData({ ...formData, mman: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-2 text-right">
              <Label>تاريخ البداية (CIFD)</Label>
              <Input
                type="date"
                value={formData.cifd}
                onChange={(e) => setFormData({ ...formData, cifd: e.target.value })}
              />
            </div>
            <div className="space-y-2 text-right">
              <Label>تاريخ النهاية (CITD)</Label>
              <Input
                type="date"
                value={formData.citd}
                onChange={(e) => setFormData({ ...formData, citd: e.target.value })}
              />
            </div>
          </div>
        </div>

        {/* Extra Fields */}
        <div className="space-y-4 md:col-span-3 border-t pt-4">
          <h4 className="font-semibold text-sm text-muted-foreground">حقول إضافية</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-1">
              <Label className="text-[10px]">حقل 2</Label>
              <Input value={formData.af2} onChange={e => setFormData({ ...formData, af2: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label className="text-[10px]">حقل 3</Label>
              <Input value={formData.af3} onChange={e => setFormData({ ...formData, af3: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label className="text-[10px]">حقل 4</Label>
              <Input value={formData.af4} onChange={e => setFormData({ ...formData, af4: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label className="text-[10px]">حقل 5</Label>
              <Input value={formData.af5} onChange={e => setFormData({ ...formData, af5: e.target.value })} />
            </div>
          </div>
        </div>
      </div>
    </BaseModal>
  );
}
