import { useState, useCallback } from 'react';
import { restartSession as restartSessionApi } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';

export function useServerRestart() {
  const [restartingIds, setRestartingIds] = useState<Set<string>>(new Set());
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const restartSession = useCallback(async (deviceId: string, name?: string) => {
    setRestartingIds((prev) => new Set(prev).add(deviceId));

    toast({
      title: "جاري إعادة تشغيل الجلسة",
      description: `إعادة تشغيل جلسة ${name || deviceId}...`,
    });

    try {
      const response = await restartSessionApi(deviceId);
      if (response.status || response.message) {
        toast({
          title: "تم إرسال طلب إعادة التشغيل",
          description: response.message || "تم إرسال الطلب بنجاح، جاري تحديث الحالة...",
        });

        // 60s timeout to clear the state if status doesn't change
        setTimeout(() => {
          setRestartingIds((prev) => {
            const next = new Set(prev);
            next.delete(deviceId);
            return next;
          });
        }, 60000);

        queryClient.invalidateQueries({ queryKey: ["users-full"] });
      } else {
        throw new Error(response.message || "Failed to restart session");
      }
    } catch (error: any) {
      setRestartingIds((prev) => {
        const next = new Set(prev);
        next.delete(deviceId);
        return next;
      });
      toast({
        title: "فشل إعادة التشغيل",
        description: error.message || "حدث خطأ أثناء إعادة تشغيل الجلسة",
        variant: "destructive",
      });
    }
  }, [toast, queryClient]);

  const isRestarting = (id: string) => restartingIds.has(id);

  return {
    restartingIds,
    restartSession,
    isRestarting,
  };
}
