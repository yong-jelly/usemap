import { Check, MoreHorizontal, Folder as FolderIcon } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import type { Folder, FolderPermission } from "@/entities/folder/types";
import { useUserStore } from "@/entities/user";

export const PERMISSION_LABEL: Record<FolderPermission, string> = {
  public: '공개',
  private: '비공개',
  hidden: '링크 공유',
  invite: '초대 전용',
  default: '기본',
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
  const permissionLabel = PERMISSION_LABEL[folder.permission] || PERMISSION_LABEL.public;
  const isCollaborative = folder.permission_write_type === 1;
  const isOwner = user?.id === folder.owner_id;

  return (
    <div
      onClick={() => onClick?.(folder.id)}
      className={cn(
        "w-full flex items-center gap-3.5 py-3.5 cursor-pointer group",
        isSelected && "bg-primary-50/50 dark:bg-primary-900/10"
      )}
    >
      {/* 폴더 아이콘 */}
      <div className={cn(
        "size-[48px] rounded-xl flex items-center justify-center shrink-0 transition-colors",
        isSelected
          ? "bg-primary-500 text-white"
          : "bg-surface-100 dark:bg-surface-800 text-surface-400"
      )}>
        <FolderIcon className="size-6 fill-current opacity-80" />
      </div>

      {/* 텍스트 정보 */}
      <div className="flex-1 min-w-0 flex flex-col gap-0.5">
        <div className="flex items-center gap-1.5">
          <p className={cn(
            "text-[15px] font-medium truncate",
            isSelected ? "text-primary-700 dark:text-primary-300" : "text-surface-900 dark:text-white"
          )}>
            {folder.title}
          </p>
          {isCollaborative && (
            <span className={cn(
              "text-[10px] px-1.5 py-0.5 rounded shrink-0",
              isOwner 
                ? "bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400" 
                : "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400"
            )}>
              {isOwner ? '관리자' : '참여자'}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5 text-[12px] text-surface-500">
          <span>{permissionLabel}</span>
          <span className="text-surface-300 dark:text-surface-600">·</span>
          <span>장소 {folder.place_count.toLocaleString()}개</span>
        </div>
        {folder.description && (
          <p className="text-[12px] text-surface-400 truncate mt-0.5">
            {folder.description}
          </p>
        )}
      </div>

      {/* 액션 영역 */}
      <div className="flex items-center gap-1 shrink-0">
        {showMoreOptions && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              (e.currentTarget as HTMLButtonElement).blur();
              onMoreClick?.(folder);
            }}
            className="p-2 text-surface-400 hover:text-surface-600 hover:bg-surface-100 dark:hover:bg-surface-800 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <MoreHorizontal className="size-5" />
          </button>
        )}

        {showCheckbox && (
          <div className={cn(
            "size-6 rounded-full border-2 flex items-center justify-center",
            isSelected
              ? "bg-primary-600 border-primary-600"
              : "border-surface-300 dark:border-surface-600"
          )}>
            {isSelected && (
              <Check className="size-3.5 text-white stroke-[3]" />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
