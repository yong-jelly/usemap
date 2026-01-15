import { Globe, Lock, Link as LinkIcon, Ghost, User, Check, MoreVertical, ShieldCheck, UserPlus } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import type { Folder, FolderPermission } from "@/entities/folder/types";
import { useUserStore } from "@/entities/user";

export const PERMISSION_INFO: Record<FolderPermission, { label: string; icon: any }> = {
  public: { 
    label: '공개', 
    icon: Globe
  },
  private: { 
    label: '비공개 (전용)', 
    icon: Lock
  },
  hidden: { 
    label: '비공개 (링크)', 
    icon: LinkIcon
  },
  invite: { 
    label: '비공개 (초대 전용)', 
    icon: Ghost
  },
  default: { 
    label: '기본 폴더', 
    icon: User
  }
};

interface FolderListItemProps {
  folder: Folder;
  isSelected?: boolean;
  showCheckbox?: boolean;
  showMoreOptions?: boolean;
  onClick?: (folderId: string) => void;
  onMoreClick?: (folder: Folder) => void;
}

export function FolderListItem({ 
  folder, 
  isSelected = false, 
  showCheckbox = false, 
  showMoreOptions = false,
  onClick,
  onMoreClick
}: FolderListItemProps) {
  const { user } = useUserStore();
  const info = PERMISSION_INFO[folder.permission] || PERMISSION_INFO.public;
  const Icon = info.icon;
  const isCollaborative = folder.permission_write_type === 1;
  const isOwner = user?.id === folder.owner_id;

  return (
    <div
      onClick={() => onClick?.(folder.id)}
      className={cn(
        "w-full flex items-center justify-between p-4 rounded-3xl transition-colors text-left border-2 cursor-pointer",
        isSelected
          ? "bg-primary-50/50 dark:bg-primary-900/10 border-primary-500/50"
          : "bg-white dark:bg-surface-900 border-surface-50 dark:border-surface-800 hover:bg-surface-50 dark:hover:bg-surface-800 shadow-sm"
      )}
    >
      <div className="flex items-center gap-4 min-w-0 flex-1">
        <div className={cn(
          "size-12 rounded-2xl flex items-center justify-center shrink-0",
          isSelected
            ? "bg-primary-500 text-white"
            : "bg-surface-100 dark:bg-surface-800 text-surface-500"
        )}>
          <Icon className="size-6" />
        </div>
        <div className="flex flex-col gap-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className={cn(
              "text-base truncate",
              isSelected ? "text-primary-900 dark:text-primary-100" : "text-surface-900 dark:text-white"
            )}>
              {folder.title}
            </p>
            {isCollaborative && (
              isOwner ? (
                <div className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-primary-100 dark:bg-primary-900/30 text-[10px] text-primary-600 dark:text-primary-400 shrink-0">
                  <ShieldCheck className="size-3" />
                  관리자
                </div>
              ) : (
                <div className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-green-100 dark:bg-green-900/30 text-[10px] text-green-600 dark:text-green-400 shrink-0">
                  <UserPlus className="size-3" />
                  참여자
                </div>
              )
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-surface-500">
              {info.label}
            </span>
            <span className="size-1 rounded-full bg-surface-200 dark:bg-surface-700 shrink-0" />
            <span className="text-xs font-medium text-surface-400 shrink-0">
              장소 {folder.place_count.toLocaleString()}개
            </span>
          </div>
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        {showMoreOptions && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              (e.currentTarget as HTMLButtonElement).blur();
              onMoreClick?.(folder);
            }}
            className="p-1.5 text-surface-400 hover:text-surface-600 hover:bg-surface-100 dark:hover:bg-surface-800 rounded-full transition-colors shrink-0"
          >
            <MoreVertical className="size-5" />
          </button>
        )}

        {showCheckbox && (
          <div className={cn(
            "size-7 rounded-full border-2 flex items-center justify-center transition-all shrink-0",
            isSelected
              ? "bg-primary-600 border-primary-600 shadow-sm"
              : "border-surface-200 dark:border-surface-700"
          )}>
            {isSelected && (
              <Check className="size-4 text-white stroke-[3]" />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
