import { Share2, Edit3, Trash2 } from "lucide-react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from "@/shared/ui";
import { cn } from "@/shared/lib/utils";
import type { Folder } from "@/entities/folder/types";

interface FolderListOptionsSheetProps {
  isOpen: boolean;
  onClose: () => void;
  folder: Folder | null;
  onEdit: (folder: Folder) => void;
  onShare: (folder: Folder) => void;
  onDelete: (folder: Folder) => void;
  dismissible?: boolean;
}

export function FolderListOptionsSheet({
  isOpen,
  onClose,
  folder,
  onEdit,
  onShare,
  onDelete,
  dismissible = true,
}: FolderListOptionsSheetProps) {
  if (!folder) return null;

  const showShare = folder.permission !== 'private' && folder.permission !== 'default';

  const menuItems = [
    {
      id: "edit",
      label: "리스트 수정하기",
      icon: Edit3,
      onClick: () => {
        onEdit(folder);
        onClose();
      },
      show: true,
    },
    {
      id: "share",
      label: "공유하기",
      icon: Share2,
      onClick: () => {
        onShare(folder);
        onClose();
      },
      show: showShare,
    },
    {
      id: "delete",
      label: "삭제하기",
      icon: Trash2,
      onClick: () => {
        onDelete(folder);
        // onDelete에서는 onClose()를 호출하지 않음 (다이얼로그가 떠야 하므로)
      },
      show: folder.permission !== 'default',
      variant: "danger" as const,
    },
  ].filter(item => item.show);

  return (
    <Drawer 
      open={isOpen} 
      onOpenChange={(open) => !open && onClose()}
      dismissible={dismissible}
    >
      <DrawerContent className="flex flex-col bg-white dark:bg-surface-950 border-surface-200 dark:border-surface-800 outline-none rounded-t-[28px] shadow-2xl max-w-lg mx-auto">
        <DrawerHeader className="flex flex-col items-center justify-center px-4 py-4 pb-3 border-b border-surface-100 dark:border-surface-800 shrink-0">
          <DrawerTitle className="text-[15px] font-bold text-surface-900 dark:text-white mt-1">
            {folder.title}
          </DrawerTitle>
          <DrawerDescription className="sr-only">
            폴더 관리 옵션을 선택하세요.
          </DrawerDescription>
        </DrawerHeader>

        <div
          className="flex-1 overflow-y-auto min-h-0 overscroll-contain px-4 py-4 pb-10"
          style={{
            willChange: "scroll-position",
            WebkitOverflowScrolling: "touch",
            transform: "translateZ(0)",
          }}
        >
          <div className="flex flex-col gap-2">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={item.onClick}
                className={cn(
                  "w-full flex items-center gap-4 p-4 rounded-xl transition-colors",
                  item.variant === "danger"
                    ? "text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10"
                    : "text-surface-700 dark:text-surface-200 hover:bg-surface-50 dark:hover:bg-surface-800"
                )}
              >
                <item.icon className="size-5" />
                <span className="text-[15px] font-medium">{item.label}</span>
              </button>
            ))}
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
