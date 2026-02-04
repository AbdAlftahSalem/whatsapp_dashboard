import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Smartphone, ArrowRight, Save, Loader2, Building2 } from 'lucide-react';
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

// Mock organizations for select
const mockOrganizations = [
  { id: 1, name: 'شركة الأمل للتجارة' },
  { id: 2, name: 'مؤسسة النور' },
  { id: 3, name: 'شركة الرياض المتحدة' },
  { id: 4, name: 'مجموعة الفجر' },
  { id: 5, name: 'شركة الخليج للاستثمار' },
];

export default function AddUserPage() {
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    orgId: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      toast({
        title: 'تمت الإضافة بنجاح',
        description: 'تم إضافة الجهاز الجديد',
      });
      
      navigate('/dashboard/users');
    } catch (error) {
      toast({
        title: 'حدث خطأ',
        description: 'فشل في إضافة الجهاز',
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
                placeholder="+966501234567"
                dir="ltr"
                required
              />
              <p className="text-xs text-muted-foreground">
                رقم الهاتف المرتبط بحساب واتساب
              </p>
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
            >
              <SelectTrigger>
                <SelectValue placeholder="اختر المنظمة التابع لها" />
              </SelectTrigger>
              <SelectContent>
                {mockOrganizations.map((org) => (
                  <SelectItem key={org.id} value={org.id.toString()}>
                    {org.name}
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
