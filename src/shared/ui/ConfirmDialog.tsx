import React from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription, 
  DialogFooter 
} from "./Dialog";
import { Button } from "./Button";
import { cn } from "@/shared/lib/utils";

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void | Promise<void>;
  isLoading?: boolean;
  variant?: "default" | "danger";
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "확인",
  cancelLabel = "취소",
  onConfirm,
  isLoading = false,
  variant = "default"
}: ConfirmDialogProps) {
  const handleConfirm = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await onConfirm();
    onOpenChange(false);
  };

  const handleCancel = (e: React.MouseEvent) => {
    e.stopPropagation();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[320px] rounded-[24px]">
        <DialogHeader>
          <DialogTitle className="text-[17px] font-black">{title}</DialogTitle>
        </DialogHeader>
        <DialogDescription className="text-sm font-medium text-surface-500 leading-relaxed whitespace-pre-wrap">
          {description}
        </DialogDescription>
        <DialogFooter className="mt-8 gap-2">
          <Button
            variant="ghost"
            onClick={handleCancel}
            className="flex-1 h-12 rounded-xl font-bold text-surface-500"
            disabled={isLoading}
          >
            {cancelLabel}
          </Button>
          <Button
            variant={variant === "danger" ? "default" : "default"}
            onClick={handleConfirm}
            className={cn(
              "flex-1 h-12 rounded-xl font-bold",
              variant === "danger" && "bg-rose-500 hover:bg-rose-600 text-white border-none"
            )}
            disabled={isLoading}
          >
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
