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
    name: '',       // name
    name2: '',      // name2
    name3: '',      // name3
    detail: '',     // detail
    phone: '',      // phone
    phone2: '',     // phone2
    phone3: '',     // phone3
    address: '',    // address
    webSite: '',    // webSite
    email: '',      // email
    country: 'YE',  // country
    manager: '',    // manager
    lan: 'ar',      // lan
    ciid: '',       // ciid
    jtid: '0',      // jtid
    suTyp: '1',     // suTyp
    cinu: '1',      // cinu
    citd: '',       // citd
  });

  const { accessToken: token } = useAuthStore();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
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
      const today = new Date().toISOString().split('T')[0];

      await addCustomer({
        CINA: formData.name,
        CINE: formData.name2,
        CIN3: formData.name3,
        CIDE: formData.detail,
        CIPH1: formData.phone,
        CIPH2: formData.phone2,
        CIPH3: formData.phone3,
        CIADD: formData.address,
        CIURL: formData.webSite,
        CIEM: formData.email,
        CICO: formData.country,
        CIMAN: formData.manager,
        CILAN: formData.lan,
        CIID: formData.ciid || 'O',
        JTID: parseInt(formData.jtid),
        CITYP: parseInt(formData.suTyp),
        CINU: parseInt(formData.cinu),
        CIFD: today,
        CITD: formData.citd,
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
    <div className="max-w-4xl pb-12">
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
          <p className="text-muted-foreground mt-1">تسجيل كافة بيانات المنظمة والمسؤول</p>
        </div>
      </div>

      {/* Form */}
      <motion.form
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        onSubmit={handleSubmit}
        className="stats-card space-y-8"
      >
        {/* Core Names */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-primary" />
            البيانات الأساسية
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">الاسم الرئيسي (الأول)</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="اسم العميل الرئيسي"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="name2">الاسم الثاني</Label>
              <Input
                id="name2"
                name="name2"
                value={formData.name2}
                onChange={handleChange}
                placeholder="الاسم الثاني"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="name3">الاسم الثالث</Label>
              <Input
                id="name3"
                name="name3"
                value={formData.name3}
                onChange={handleChange}
                placeholder="الاسم الثالث"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div className="space-y-2">
              <Label htmlFor="detail">طلب العميل / التفاصيل</Label>
              <Input
                id="detail"
                name="detail"
                value={formData.detail}
                onChange={handleChange}
                placeholder="أدخل تفاصيل الطلب أو النشاط"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="manager">مدير المنظمة</Label>
              <Input
                id="manager"
                name="manager"
                value={formData.manager}
                onChange={handleChange}
                placeholder="اسم الشخص المسؤول"
              />
            </div>
          </div>
        </div>

        {/* Contact Info */}
        <div className="border-t border-border pt-6 space-y-4">
          <h3 className="text-lg font-semibold text-foreground mb-4">بيانات الاتصال والعنوان</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone">رقم الهاتف (أساسي)</Label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleChange}
                placeholder="+966..."
                dir="ltr"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone2">رقم الهاتف 2</Label>
              <Input
                id="phone2"
                name="phone2"
                type="tel"
                value={formData.phone2}
                onChange={handleChange}
                placeholder="رقم آخر"
                dir="ltr"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone3">رقم الهاتف 3</Label>
              <Input
                id="phone3"
                name="phone3"
                type="tel"
                value={formData.phone3}
                onChange={handleChange}
                placeholder="رقم إضافي"
                dir="ltr"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">البريد الإلكتروني</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="email@example.com"
                dir="ltr"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="webSite">الموقع الإلكتروني</Label>
              <Input
                id="webSite"
                name="webSite"
                value={formData.webSite}
                onChange={handleChange}
                placeholder="www.website.com"
                dir="ltr"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="address">العنوان</Label>
              <div className="relative">
                <MapPin className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="المدينة - الحي - الشارع"
                  className="pr-10"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="country">الدولة</Label>
                <Input
                  id="country"
                  name="country"
                  value={formData.country}
                  onChange={handleChange}
                  placeholder="YE"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lan">اللغة</Label>
                <select
                  id="lan"
                  name="lan"
                  value={formData.lan}
                  onChange={handleChange}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="ar">العربية</option>
                  <option value="en">الإنجليزية</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Subscription Info */}
        <div className="border-t border-border pt-6 space-y-4">
          <h3 className="text-lg font-semibold text-foreground mb-4">بيانات الاشتراك والنظام</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="suTyp">نوع الاشتراك</Label>
              <select
                id="suTyp"
                name="suTyp"
                value={formData.suTyp}
                onChange={handleChange}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="1">شهري</option>
                <option value="2">سنوي</option>
                <option value="3">تجريبي</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="cinu">عدد الأجهزة</Label>
              <Input
                id="cinu"
                name="cinu"
                type="number"
                min="1"
                value={formData.cinu}
                onChange={handleChange}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ciid">الرقم العام (CIID)</Label>
              <Input
                id="ciid"
                name="ciid"
                value={formData.ciid}
                onChange={handleChange}
                placeholder="مثلاً: O"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="jtid">نوع النشاط (JTID)</Label>
              <Input
                id="jtid"
                name="jtid"
                type="number"
                value={formData.jtid}
                onChange={handleChange}
              />
            </div>
          </div>
          <div className="max-w-xs space-y-2">
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

        {/* Actions */}
        <div className="flex items-center justify-end gap-4 pt-4 border-t border-border">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/dashboard/customers')}
          >
            إلغاء
          </Button>
          <Button type="submit" disabled={isLoading} className="px-8">
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                جاري الحفظ...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 ml-2" />
                تأكيد وبدء التفعيل
              </>
            )}
          </Button>
        </div>
      </motion.form>
    </div>
  );
}
