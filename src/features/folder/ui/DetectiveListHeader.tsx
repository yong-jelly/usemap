import { useNavigate } from "react-router";
import { FolderPlus, FolderHeart } from "lucide-react";
import { Button } from "@/shared/ui";
import { useUserStore } from "@/entities/user";
import { useAuthModalStore } from "@/features/auth/model/useAuthModalStore";

interface DetectiveListHeaderProps {
  /** 헤더 제목 (기본값: "추천 맛탐정") */
  title?: string;
  /** 헤더 설명 (기본값: "다른 사용자들이 공유한 맛집 리스트입니다.") */
  description?: string;
  /** '맛탐정 생성' 버튼 표시 여부 (기본값: false) */
  showCreateButton?: boolean;
  /** '내 폴더 관리' 버튼 표시 여부 (기본값: false) */
  showManageButton?: boolean;
}

/**
 * DetectiveListHeader 컴포넌트
 * 
 * 맛탐정 리스트의 상단 헤더 섹션을 담당합니다.
 * 제목, 설명 및 선택적인 액션 버튼(생성, 관리)을 포함합니다.
 * 
 * @example
 * ```tsx
 * <DetectiveListHeader 
 *   showCreateButton={true} 
 *   showManageButton={true} 
 * />
 * ```
 */
export function DetectiveListHeader({
  title = "추천 맛탐정",
  description = "다른 사용자들이 공유한 맛집 리스트입니다.",
  showCreateButton = false,
  showManageButton = false,
}: DetectiveListHeaderProps) {
  const navigate = useNavigate();
  const { isAuthenticated } = useUserStore();
  const { openLogin } = useAuthModalStore();

  const handleCreateClick = () => {
    if (!isAuthenticated) {
      openLogin();
      return;
    }
    navigate("/folder/create");
  };

  const handleManageClick = () => {
    if (!isAuthenticated) {
      openLogin();
      return;
    }
    navigate("/profile/folder");
  };

  return (
    <div className="mx-4 p-4 rounded-2xl bg-surface-50 dark:bg-surface-900/50 border border-surface-100 dark:border-surface-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      <div className="flex flex-col gap-0.5 min-w-0 flex-1">
        <h2 className="text-sm font-medium text-surface-900 dark:text-white leading-tight">
          {title}
        </h2>
        <p className="text-xs text-surface-500 dark:text-surface-400 leading-relaxed">
          {description}
        </p>
      </div>
      
      {(showCreateButton || showManageButton) && (
        <div className="flex items-center gap-2 shrink-0 flex-wrap sm:flex-nowrap">
          {showCreateButton && (
            <Button
              variant="outline"
              size="sm"
              className="rounded-full font-medium gap-1.5 bg-white dark:bg-surface-800 text-surface-600 border-surface-200 h-9 px-3 shadow-sm flex-1 sm:flex-none"
              onClick={handleCreateClick}
            >
              <FolderPlus className="size-4" />
              <span className="text-xs">맛탐정 생성</span>
            </Button>
          )}
          {showManageButton && (
            <Button
              variant="outline"
              size="sm"
              className="rounded-full font-medium gap-1.5 bg-white dark:bg-surface-800 text-surface-600 border-surface-200 h-9 px-3 shadow-sm flex-1 sm:flex-none"
              onClick={handleManageClick}
            >
              <FolderHeart className="size-4" />
              <span className="text-xs">내 폴더 관리</span>
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
