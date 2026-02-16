import * as React from "react";
import { ConfirmModal } from "./ConfirmModal";

interface DeleteConfirmModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void | Promise<void>;
  title?: string;
  description?: string;
  itemName?: string;
  itemId?: string | number;
  isLoading?: boolean;
  warningMessage?: string;
}

export function DeleteConfirmModal({
  open,
  onOpenChange,
  onConfirm,
  title = "حذف العنصر",
  description,
  itemName,
  itemId,
  isLoading = false,
  warningMessage,
}: DeleteConfirmModalProps) {
  const finalDescription = description || warningMessage || (itemName ? `هل أنت متأكد من حذف ${itemName} ${itemId ? `(${itemId})` : ''}؟ هذا الإجراء لا يمكن التراجع عنه.` : "هل أنت متأكد من حذف هذا العنصر؟ هذا الإجراء لا يمكن التراجع عنه.");
  
  return (
    <ConfirmModal
      open={open}
      onOpenChange={onOpenChange}
      onConfirm={onConfirm}
      title={title}
      description={finalDescription}
      confirmText="حذف"
      cancelText="إلغاء"
      isLoading={isLoading}
      variant="destructive"
    />
  );
}
