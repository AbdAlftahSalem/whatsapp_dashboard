import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Building2,
  Plus,
  Search,
  MoreHorizontal,
  Edit2,
  Trash2,
  Eye,
  Filter,
  Phone,
  Mail,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { StatusBadge } from '@/components/ui/StatusBadge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { WA_Organization } from '@/types';

// Mock data
const mockCustomers: WA_Organization[] = [
  { id: 1, org: 'ORG001', name: 'شركة الأمل للتجارة', email: 'info@alamal.com', phone: '+966501234567', country: 'السعودية', address: 'الرياض', active: true, deviceNumber: 10 },
  { id: 2, org: 'ORG002', name: 'مؤسسة النور', email: 'contact@alnoor.sa', phone: '+966507654321', country: 'السعودية', address: 'جدة', active: true, deviceNumber: 5 },
  { id: 3, org: 'ORG003', name: 'شركة الرياض المتحدة', email: 'sales@riyadh-united.com', phone: '+966509876543', country: 'السعودية', address: 'الرياض', active: false, deviceNumber: 15 },
  { id: 4, org: 'ORG004', name: 'مجموعة الفجر', email: 'info@alfajr.sa', phone: '+966502345678', country: 'السعودية', address: 'الدمام', active: true, deviceNumber: 8 },
  { id: 5, org: 'ORG005', name: 'شركة الخليج للاستثمار', email: 'invest@gulf.com', phone: '+966503456789', country: 'السعودية', address: 'الخبر', active: true, deviceNumber: 20 },
];

export default function CustomersPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [customers] = useState<WA_Organization[]>(mockCustomers);

  const filteredCustomers = customers.filter(
    (customer) =>
      customer.name.includes(searchQuery) ||
      customer.email.includes(searchQuery) ||
      customer.phone.includes(searchQuery)
  );

  return (
    <div className="space-y-4 lg:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-foreground">العملاء</h1>
          <p className="text-sm text-muted-foreground mt-1">إدارة المنظمات والاشتراكات</p>
        </div>
        <Link to="/dashboard/customers/add">
          <Button className="gap-2 w-full sm:w-auto">
            <Plus className="w-4 h-4" />
            إضافة عميل
          </Button>
        </Link>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="البحث بالاسم أو البريد أو الهاتف..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pr-10"
          />
        </div>
        <Button variant="outline" className="gap-2">
          <Filter className="w-4 h-4" />
          تصفية
        </Button>
      </div>

      {/* Desktop Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="data-table hidden lg:block"
      >
        <table className="w-full">
          <thead>
            <tr>
              <th>المنظمة</th>
              <th>البريد الإلكتروني</th>
              <th>الهاتف</th>
              <th>عدد الأجهزة</th>
              <th>الحالة</th>
              <th>الإجراءات</th>
            </tr>
          </thead>
          <tbody>
            {filteredCustomers.map((customer, index) => (
              <motion.tr
                key={customer.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <td>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Building2 className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{customer.name}</p>
                      <p className="text-xs text-muted-foreground">{customer.org}</p>
                    </div>
                  </div>
                </td>
                <td className="text-muted-foreground" dir="ltr">{customer.email}</td>
                <td className="text-muted-foreground" dir="ltr">{customer.phone}</td>
                <td>
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-muted text-sm">
                    {customer.deviceNumber} جهاز
                  </span>
                </td>
                <td>
                  <StatusBadge status={customer.active ? 'active' : 'inactive'} />
                </td>
                <td>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-40">
                      <DropdownMenuItem className="gap-2">
                        <Eye className="w-4 h-4" />
                        عرض التفاصيل
                      </DropdownMenuItem>
                      <DropdownMenuItem className="gap-2">
                        <Edit2 className="w-4 h-4" />
                        تعديل
                      </DropdownMenuItem>
                      <DropdownMenuItem className="gap-2 text-destructive">
                        <Trash2 className="w-4 h-4" />
                        حذف
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>

        {filteredCustomers.length === 0 && (
          <div className="p-12 text-center">
            <Building2 className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground">لا توجد نتائج</p>
          </div>
        )}
      </motion.div>

      {/* Mobile Cards */}
      <div className="lg:hidden space-y-3">
        {filteredCustomers.map((customer, index) => (
          <motion.div
            key={customer.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="bg-card rounded-xl border border-border p-4 space-y-3"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-foreground">{customer.name}</p>
                  <p className="text-xs text-muted-foreground">{customer.org}</p>
                </div>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreHorizontal className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-40">
                  <DropdownMenuItem className="gap-2">
                    <Eye className="w-4 h-4" />
                    عرض التفاصيل
                  </DropdownMenuItem>
                  <DropdownMenuItem className="gap-2">
                    <Edit2 className="w-4 h-4" />
                    تعديل
                  </DropdownMenuItem>
                  <DropdownMenuItem className="gap-2 text-destructive">
                    <Trash2 className="w-4 h-4" />
                    حذف
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Mail className="w-4 h-4" />
                <span dir="ltr" className="truncate">{customer.email}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Phone className="w-4 h-4" />
                <span dir="ltr">{customer.phone}</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-border">
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-muted text-xs">
                {customer.deviceNumber} جهاز
              </span>
              <StatusBadge status={customer.active ? 'active' : 'inactive'} />
            </div>
          </motion.div>
        ))}

        {filteredCustomers.length === 0 && (
          <div className="p-12 text-center bg-card rounded-xl border border-border">
            <Building2 className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground">لا توجد نتائج</p>
          </div>
        )}
      </div>

      {/* Pagination */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground">
          عرض {filteredCustomers.length} من {customers.length} عميل
        </p>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" disabled>
            السابق
          </Button>
          <Button variant="outline" size="sm" className="bg-primary text-primary-foreground">
            1
          </Button>
          <Button variant="outline" size="sm">
            2
          </Button>
          <Button variant="outline" size="sm">
            التالي
          </Button>
        </div>
      </div>
    </div>
  );
}
