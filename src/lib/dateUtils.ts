export const formatDate = (date: string | null | undefined, locale: string = 'ar-YE') => {
  if (!date) return '-';
  try {
    return new Date(date).toLocaleDateString(locale);
  } catch (error) {
    return '-';
  }
};

export const formatDateTime = (date: string | null | undefined, locale: string = 'ar-YE') => {
  if (!date) return '-';
  try {
    return new Date(date).toLocaleString(locale);
  } catch (error) {
    return '-';
  }
};

export const formatRelativeTime = (date: string | null | undefined) => {
  if (!date) return '-';
  const now = new Date();
  const then = new Date(date);
  const diffInSeconds = Math.floor((now.getTime() - then.getTime()) / 1000);

  if (diffInSeconds < 60) return 'الآن';
  if (diffInSeconds < 3600) return `منذ ${Math.floor(diffInSeconds / 60)} دقيقة`;
  if (diffInSeconds < 86400) return `منذ ${Math.floor(diffInSeconds / 3600)} ساعة`;
  return formatDate(date);
};
