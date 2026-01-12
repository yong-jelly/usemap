import { Share2, Edit3, Trash2, X } from "lucide-react";
import { 
  Drawer, 
  DrawerContent, 
  DrawerHeader, 
  DrawerTitle, 
  DrawerDescription,
  Button 
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
      <DrawerContent className="bg-white dark:bg-surface-900 border-t-2 border-[#2B4562]/10 shadow-none rounded-t-[32px] max-w-lg mx-auto">
        <DrawerHeader className="px-6 py-5 relative flex items-center justify-center">
          <DrawerTitle className="text-lg font-black text-surface-900 dark:text-white text-center">
            {folder.title}
          </DrawerTitle>
          <DrawerDescription className="sr-only">
            폴더 관리 옵션을 선택하세요.
          </DrawerDescription>
          <button 
            onClick={onClose}
            className="absolute right-6 p-2 -mr-2 text-surface-400 hover:text-surface-600 transition-colors"
          >
            <X className="size-6" />
          </button>
        </DrawerHeader>

        <div className="mx-6 border-b border-surface-100 dark:border-surface-800" />

        <div className="px-4 py-6 pb-10 flex flex-col gap-2">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={item.onClick}
              className={cn(
                "w-full flex items-center gap-4 p-4 rounded-2xl transition-colors",
                item.variant === "danger"
                  ? "text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10"
                  : "text-surface-700 dark:text-surface-200 hover:bg-surface-50 dark:hover:bg-surface-800"
              )}
            >
              <item.icon className="size-6" />
              <span className="text-lg font-bold">{item.label}</span>
            </button>
          ))}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
