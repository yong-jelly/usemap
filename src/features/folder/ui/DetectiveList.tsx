import { useRef, useEffect } from "react";
import { useNavigate } from "react-router";
import { usePublicFolders } from "@/entities/folder/queries";
import { FolderCard } from "./FolderCard";
import { Button } from "@/shared/ui";
import { Loader2, FolderHeart } from "lucide-react";
import { useUserStore } from "@/entities/user";
import { useAuthModalStore } from "@/features/auth/model/useAuthModalStore";

export function DetectiveList() {
  const navigate = useNavigate();
  const { isAuthenticated } = useUserStore();
  const { openLogin } = useAuthModalStore();
  
  const { 
    data: publicFoldersData, 
    fetchNextPage, 
    hasNextPage, 
    isFetchingNextPage, 
    isLoading: isPublicLoading 
  } = usePublicFolders();

  const observerTarget = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!hasNextPage || isFetchingNextPage) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          fetchNextPage();
        }
      },
      { threshold: 0, rootMargin: '200px' }
    );

    const currentTarget = observerTarget.current;
    if (currentTarget) observer.observe(currentTarget);

    return () => {
      if (currentTarget) observer.unobserve(currentTarget);
    };
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const publicFolders = publicFoldersData?.pages.flatMap((page) => page) || [];

  if (isPublicLoading) {
    return (
      <div className="flex justify-center p-12">
        <Loader2 className="size-8 text-surface-300 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 py-4">
      {/* 공개 폴더 섹션 */}
      <div className="flex flex-col gap-4">
        <div className="mx-4 p-4 rounded-2xl bg-surface-50 dark:bg-surface-900/50 border border-surface-100 dark:border-surface-800 flex items-center justify-between gap-3">
          <div className="flex flex-col gap-0.5">
            <h2 className="text-sm font-bold text-surface-900 dark:text-white leading-tight">추천 맛탐정</h2>
            <p className="text-xs text-surface-500 dark:text-surface-400 leading-relaxed">다른 사용자들이 공유한 맛집 리스트입니다.</p>
          </div>
          <Button 
            variant="outline" 
            size="sm"
            className="rounded-full font-bold gap-1.5 bg-white dark:bg-surface-800 text-surface-600 border-surface-200 h-9 px-3 shrink-0 shadow-sm"
            onClick={() => {
              if (!isAuthenticated) {
                openLogin();
                return;
              }
              navigate("/profile/folder");
            }}
          >
            <FolderHeart className="size-4" />
            <span className="text-xs">내 폴더 관리</span>
          </Button>
        </div>
        <div className="flex flex-col">
          {publicFolders.map((folder) => (
            <FolderCard key={folder.id} folder={folder} showOwner={true} />
          ))}
        </div>
      </div>

      {hasNextPage && (
        <div ref={observerTarget} className="p-12 flex justify-center">
          <Loader2 className="size-6 text-surface-300 animate-spin" />
        </div>
      )}
    </div>
  );
}
