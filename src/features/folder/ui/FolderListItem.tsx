import { Globe, Lock, Link as LinkIcon, Ghost, User, Check, MoreVertical, ShieldCheck, UserPlus, ChevronRight } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import type { Folder, FolderPermission } from "@/entities/folder/types";
import { useUserStore } from "@/entities/user";

export const PERMISSION_INFO: Record<FolderPermission, { label: string; icon: any }> = {
  public: { 
    label: '공개', 
    icon: Globe
  },
  private: { 
    label: '비공개', 
    icon: Lock
  },
  hidden: { 
    label: '링크 공개', 
    icon: LinkIcon
  },
  invite: { 
    label: '초대 전용', 
    icon: Ghost
  },
  default: { 
    label: '기본', 
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

  // 미리보기 이미지 (최대 3개)
  const previewImages = folder.preview_places?.slice(0, 3).map((p: any) => 
    p.image_urls?.[0] || p.images?.[0] || p.thumbnail
  ).filter(Boolean) || [];

  return (
    <div
      onClick={() => onClick?.(folder.id)}
      className={cn(
        "w-full flex items-center gap-4 p-3 rounded-2xl transition-all text-left cursor-pointer group",
        isSelected
          ? "bg-primary-50/50 dark:bg-primary-900/10"
          : "bg-white dark:bg-surface-950 hover:bg-surface-50 dark:hover:bg-surface-900"
      )}
    >
      {/* 폴더 아이콘 또는 썸네일 스택 */}
      <div className="relative shrink-0">
        {previewImages.length > 0 ? (
          <div className="size-14 relative">
            {/* Apple 스타일 이미지 스택 (피그마 벡스 느낌의 겹침) */}
            {previewImages.slice(0, 3).map((img, idx) => (
              <div
                key={idx}
                className={cn(
                  "absolute inset-0 rounded-xl overflow-hidden border border-white dark:border-surface-900 shadow-sm transition-transform duration-300",
                  idx === 0 && "z-30 scale-100",
                  idx === 1 && "z-20 translate-x-1.5 -translate-y-1 scale-[0.95] opacity-80 group-hover:translate-x-3 group-hover:-translate-y-2",
                  idx === 2 && "z-10 translate-x-3 -translate-y-2 scale-[0.9] opacity-60 group-hover:translate-x-6 group-hover:-translate-y-4"
                )}
              >
                <img src={img} alt="" className="w-full h-full object-cover" loading="lazy" />
              </div>
            ))}
          </div>
        ) : (
          <div className={cn(
            "size-14 rounded-2xl flex items-center justify-center shrink-0 transition-colors",
            isSelected
              ? "bg-primary-500 text-white"
              : "bg-surface-100 dark:bg-surface-800 text-surface-400"
          )}>
            <Icon className="size-6 stroke-[1.5]" />
          </div>
        )}
      </div>

      <div className="flex flex-col gap-0.5 min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className={cn(
            "text-[15px] font-medium truncate tracking-tight",
            isSelected ? "text-primary-900 dark:text-primary-100" : "text-surface-900 dark:text-white"
          )}>
            {folder.title}
          </p>
          {isCollaborative && (
            <div className={cn(
              "px-1.5 py-0.5 rounded-md text-[10px] font-medium shrink-0",
              isOwner 
                ? "bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400" 
                : "bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400"
            )}>
              {isOwner ? "관리자" : "참여자"}
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-1.5">
          <span className="text-[12px] text-surface-400 font-normal">
            장소 {folder.place_count.toLocaleString()}개
          </span>
          <span className="size-0.5 rounded-full bg-surface-200 dark:bg-surface-700 shrink-0" />
          <span className="text-[12px] text-surface-400 font-normal truncate">
            {folder.description || info.label}
          </span>
        </div>
      </div>
      
      <div className="flex items-center gap-1 shrink-0">
        {showMoreOptions ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onMoreClick?.(folder);
            }}
            className="p-2 text-surface-300 hover:text-surface-500 hover:bg-surface-100 dark:hover:bg-surface-800 rounded-full transition-colors"
          >
            <MoreVertical className="size-4" />
          </button>
        ) : (
          !showCheckbox && <ChevronRight className="size-4 text-surface-200 group-hover:text-surface-400 transition-colors" />
        )}

        {showCheckbox && (
          <div className={cn(
            "size-5 rounded-full border flex items-center justify-center transition-all",
            isSelected
              ? "bg-primary-600 border-primary-600 shadow-sm"
              : "border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900"
          )}>
            {isSelected && (
              <Check className="size-3 text-white stroke-[3]" />
            )}
          </div>
        )}
      </div>
    </div>
  );
}

