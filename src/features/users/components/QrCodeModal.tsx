import * as React from "react";
import { BaseModal } from "@/components/ui/BaseModal";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw, Smartphone } from "lucide-react";

interface QrCodeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  qrCode: string | null;
  isLoading: boolean;
  onRefresh: () => void;
  deviceName?: string;
}

export function QrCodeModal({
  open,
  onOpenChange,
  qrCode,
  isLoading,
  onRefresh,
  deviceName,
}: QrCodeModalProps) {
  return (
    <BaseModal
      open={open}
      onOpenChange={onOpenChange}
      title="ربط الواتساب (QR Code)"
      description={`امسح الرمز لربط الجهاز: ${deviceName || 'غير معروف'}`}
      size="md"
      footer={
        <div className="flex justify-center w-full">
          <Button onClick={onRefresh} variant="outline" className="gap-2" disabled={isLoading}>
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            تحديث الرمز
          </Button>
        </div>
      }
    >
      <div className="flex flex-col items-center justify-center p-8 space-y-6">
        {isLoading ? (
          <div className="w-64 h-64 bg-muted animate-pulse rounded-2xl flex items-center justify-center">
            <Loader2 className="w-12 h-12 text-primary animate-spin" />
          </div>
        ) : qrCode ? (
          <div className="relative group">
            <div className="absolute -inset-4 bg-gradient-to-r from-primary/20 to-primary/5 blur-xl rounded-[2rem] opacity-50 transition-opacity group-hover:opacity-100" />
            <div className="relative bg-white p-4 rounded-2xl shadow-2xl ring-1 ring-black/5">
              <img src={qrCode} alt="QR Code" className="w-64 h-64" />
            </div>
          </div>
        ) : (
          <div className="w-64 h-64 border-2 border-dashed border-muted-foreground/20 rounded-2xl flex flex-col items-center justify-center text-muted-foreground p-6 text-center space-y-3">
            <Smartphone className="w-12 h-12 opacity-20" />
            <p className="text-sm font-medium">لم يتم توليد الرمز بعد، اضغط تحديث للمحاولة</p>
          </div>
        )}
      </div>
    </BaseModal>
  );
}
