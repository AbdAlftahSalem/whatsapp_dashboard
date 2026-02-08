import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Building2, ArrowRight, Save, Loader2, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { addCustomer } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';

export default function AddCustomerPage() {
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    firstName: '',
    secondName: '',
    thirdName: '',
    phone: '',
    secondPhone: '',
    email: '',
    company: '',
    workType: '',
    address: '',
    cinu: '1',
    citd: '',
  });

  const { accessToken: token } = useAuthStore();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      toast({ title: 'خطأ', description: 'انتهت الجلسة، يرجى تسجيل الدخول مجدداً', variant: 'destructive' });
      return;
    }

    setIsLoading(true);

    try {
      const today = new Promise(resolve => resolve(new Date().toISOString().split('T')[0]));
      const startDate = await today as string;

      await addCustomer({
        name: formData.company,
        name2: `${formData.firstName} ${formData.secondName} ${formData.thirdName}`.trim(),
        detail: formData.workType,
        phone: formData.phone,
        email: formData.email,
        address: formData.address || 'اليمن',
        country: 'YE',
        lan: 'ar',
        suTyp: 1,
        cinu: parseInt(formData.cinu),
        cifd: startDate,
        citd: formData.citd,
      }, token);
      
      toast({
        title: 'تمت الإضافة بنجاح',
        description: 'تم إضافة العميل الجديد وتفعيل المنظمة',
      });
      
      navigate('/dashboard/customers');
    } catch (error) {
      console.error('Add customer error:', error);
      toast({
        title: 'حدث خطأ',
        description: error instanceof Error ? error.message : 'فشل في إضافة العميل',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-3xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/dashboard/customers')}
        >
          <ArrowRight className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">إضافة عميل جديد</h1>
          <p className="text-muted-foreground mt-1">تسجيل منظمة جديدة في النظام</p>
        </div>
      </div>

      {/* Form */}
      <motion.form
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        onSubmit={handleSubmit}
        className="stats-card space-y-6"
      >
        {/* Personal Info */}
        <div>
          <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-primary" />
            معلومات العميل
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">الاسم الأول</Label>
              <Input
                id="firstName"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                placeholder="أدخل الاسم الأول"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="secondName">الاسم الثاني</Label>
              <Input
                id="secondName"
                name="secondName"
                value={formData.secondName}
                onChange={handleChange}
                placeholder="أدخل الاسم الثاني"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="thirdName">الاسم الثالث</Label>
              <Input
                id="thirdName"
                name="thirdName"
                value={formData.thirdName}
                onChange={handleChange}
                placeholder="أدخل الاسم الثالث"
              />
            </div>
          </div>
        </div>

        {/* Contact Info */}
        <div className="border-t border-border pt-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">معلومات الاتصال</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone">رقم الهاتف</Label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleChange}
                placeholder="+966501234567"
                dir="ltr"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="secondPhone">رقم الهاتف الثاني</Label>
              <Input
                id="secondPhone"
                name="secondPhone"
                type="tel"
                value={formData.secondPhone}
                onChange={handleChange}
                placeholder="+966507654321"
                dir="ltr"
              />
            </div>
            <div className="space-y-2 md:col-span-1">
              <Label htmlFor="email">البريد الإلكتروني</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="example@company.com"
                dir="ltr"
                required
              />
            </div>
            <div className="space-y-2 md:col-span-1">
              <Label htmlFor="address">العنوان</Label>
              <div className="relative">
                <MapPin className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="مثال: صنعاء - حي حدة"
                  className="pr-10"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Company Info */}
        <div className="border-t border-border pt-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">معلومات الشركة</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="company">اسم الشركة</Label>
              <Input
                id="company"
                name="company"
                value={formData.company}
                onChange={handleChange}
                placeholder="اسم الشركة أو المؤسسة"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="workType">نوع العمل</Label>
              <Input
                id="workType"
                name="workType"
                value={formData.workType}
                onChange={handleChange}
                placeholder="مثال: تجارة إلكترونية"
              />
            </div>
          </div>
        </div>

        {/* Subscription Info */}
        <div className="border-t border-border pt-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">معلومات الاشتراك</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cinu">الحد الأقصى للأجهزة</Label>
              <Input
                id="cinu"
                name="cinu"
                type="number"
                min="1"
                value={formData.cinu}
                onChange={handleChange}
                placeholder="عدد الأجهزة المسموح بها"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="citd">تاريخ انتهاء الاشتراك</Label>
              <Input
                id="citd"
                name="citd"
                type="date"
                value={formData.citd}
                onChange={handleChange}
                required
              />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-4 pt-4 border-t border-border">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/dashboard/customers')}
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
                حفظ العميل
              </>
            )}
          </Button>
        </div>
      </motion.form>
    </div>
  );
}
