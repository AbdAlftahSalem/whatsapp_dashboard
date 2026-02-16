import * as React from "react";
import { BaseModal } from "./BaseModal";
import { Button } from "./button";
import { AlertCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ConfirmModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  isLoading?: boolean;
  variant?: 'default' | 'destructive';
}

export function ConfirmModal({
  open,
  onOpenChange,
  onConfirm,
  title,
  description,
  confirmText = "تأكيد",
  cancelText = "إلغاء",
  isLoading = false,
  variant = 'default',
}: ConfirmModalProps) {
  return (
    <BaseModal
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description={description}
      size="sm"
      footer={
        <div className="flex items-center gap-2 w-full justify-end">
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            {cancelText}
          </Button>
          <Button
            variant={variant}
            onClick={async () => {
              await onConfirm();
              // Note: we don't automatically close so the caller can decide based on success
            }}
            disabled={isLoading}
            className="gap-2"
          >
            {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
            {confirmText}
          </Button>
        </div>
      }
    >
      <div className="flex items-center gap-4 text-right">
        <div className={cn(
          "w-12 h-12 rounded-full flex items-center justify-center shrink-0",
          variant === 'destructive' ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary"
        )}>
          <AlertCircle className="w-6 h-6" />
        </div>
        <div className="text-sm text-muted-foreground">
          {description || "هل أنت متأكد من القيام بهذا الإجراء؟"}
        </div>
      </div>
    </BaseModal>
  );
}
