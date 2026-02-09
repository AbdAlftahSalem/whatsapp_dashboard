import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Smartphone, ArrowRight, Save, Loader2, Building2, Lock, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';
import { getCustomers, addUser } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';

export default function AddUserPage() {
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { accessToken: token } = useAuthStore();

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    orgId: '',
    pass: '',
    detail: '',
  });

  const { data: customersData, isLoading: isLoadingCustomers } = useQuery({
    queryKey: ['customers'],
    queryFn: getCustomers,
  });

  const customers = customersData?.data.customers || [];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!token) {
      toast({ title: 'خطأ', description: 'انتهت الجلسة، يرجى تسجيل الدخول مجدداً', variant: 'destructive' });
      return;
    }

    const selectedOrg = customers.find(c => c.CISEQ.toString() === formData.orgId);
    if (!selectedOrg) {
      toast({ title: 'خطأ', description: 'يرجى اختيار المنظمة', variant: 'destructive' });
      return;
    }

    setIsLoading(true);

    try {
      const payload: any = {
        org: selectedOrg.CIORG,
        name: formData.name,
        lan: 'ar'
      };

      if (formData.phone) payload.phone = formData.phone;
      if (formData.pass) payload.pass = formData.pass;
      if (formData.detail) payload.detail = formData.detail;

      await addUser(payload, token);

      toast({
        title: 'تمت الإضافة بنجاح',
        description: 'تم إضافة الجهاز الجديد بنجاح',
      });

      navigate('/dashboard/users');
    } catch (error) {
      console.error('Add user error:', error);
      toast({
        title: 'حدث خطأ',
        description: error instanceof Error ? error.message : 'فشل في إضافة الجهاز',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/dashboard/users')}
        >
          <ArrowRight className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">إضافة جهاز جديد</h1>
          <p className="text-muted-foreground mt-1">ربط جهاز واتساب بمنظمة</p>
        </div>
      </div>

      {/* Form */}
      <motion.form
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        onSubmit={handleSubmit}
        className="stats-card space-y-6"
      >
        {/* Device Info */}
        <div>
          <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-primary" />
            معلومات الجهاز
          </h3>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">اسم الجهاز</Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="مثال: جهاز المبيعات الرئيسي"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">رقم الهاتف</Label>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="967777777777 (اختياري)"
                  dir="ltr"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="pass">كلمة المرور</Label>
                <div className="relative">
                  <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="pass"
                    name="pass"
                    type="password"
                    value={formData.pass}
                    onChange={handleChange}
                    placeholder="كلمة المرور (تلقائي إذا ترك فارغاً)"
                    className="pr-10"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="detail">التفاصيل</Label>
                <div className="relative">
                  <FileText className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="detail"
                    name="detail"
                    value={formData.detail}
                    onChange={handleChange}
                    placeholder="موقع الجهاز أو الغرض منه"
                    className="pr-10"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Organization */}
        <div className="border-t border-border pt-6">
          <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-primary" />
            المنظمة
          </h3>
          <div className="space-y-2">
            <Label htmlFor="orgId">اختر المنظمة</Label>
            <Select
              value={formData.orgId}
              onValueChange={(value) => setFormData({ ...formData, orgId: value })}
              disabled={isLoadingCustomers}
            >
              <SelectTrigger>
                <SelectValue placeholder={isLoadingCustomers ? "جاري تحميل المنظمات..." : "اختر المنظمة التابع لها"} />
              </SelectTrigger>
              <SelectContent>
                {customers.map((org) => (
                  <SelectItem key={org.CISEQ} value={org.CISEQ.toString()}>
                    <div className="flex flex-col items-start">
                      <span className="font-medium">{org.CINA || org.CINE || 'بدون اسم'}</span>
                      <span className="text-[10px] text-muted-foreground">{org.CIORG}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Info Box */}
        <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
          <p className="text-sm text-foreground">
            <strong>ملاحظة:</strong> بعد إضافة الجهاز، سيتم توليد رمز QR لربط الجهاز بحساب واتساب.
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-4 pt-4 border-t border-border">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/dashboard/users')}
          >
            إلغاء
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                جاري الحفظ...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 ml-2" />
                إضافة الجهاز
              </>
            )}
          </Button>
        </div>
      </motion.form>
    </div>
  );
}
