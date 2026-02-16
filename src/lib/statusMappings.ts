export const SESSION_STATUS = {
  ready: { label: 'جاهز', color: 'success' },
  authenticated: { label: 'متصل', color: 'success' },
  logout: { label: 'تسجيل خروج', color: 'destructive' },
  qr: { label: 'QR', color: 'warning' },
  none: { label: 'غير محدد', color: 'info' },
  maxqrcodetries: { label: 'تجاوز محاولات QR', color: 'destructive' },
} as const;

export const SERVER_STATUS = {
  online: { label: 'متصل', color: 'success' },
  offline: { label: 'غير متصل', color: 'destructive' },
  restarting: { label: 'جاري إعادة التشغيل', color: 'warning' },
  shutdown: { label: 'مغلق', color: 'error' },
} as const;

export const CUSTOMER_STATUS = {
  1: { label: 'فعال', type: 'active' },
  2: { label: 'موقوف', type: 'inactive' },
} as const;

export type SessionStatusType = keyof typeof SESSION_STATUS;
export type ServerStatusType = keyof typeof SERVER_STATUS;
