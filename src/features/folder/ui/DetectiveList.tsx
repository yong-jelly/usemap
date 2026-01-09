import { useRef, useEffect } from "react";
import { useNavigate } from "react-router";
import { usePublicFolders, useMyFolders } from "@/entities/folder/queries";
import { FolderCard } from "./FolderCard";
import { Button } from "@/shared/ui";
import { Loader2, Plus, FolderHeart } from "lucide-react";
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

  const { data: myFolders, isLoading: isMyLoading } = useMyFolders();

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

  const handleCreateClick = () => {
    if (!isAuthenticated) {
      openLogin();
      return;
    }
    navigate("/folder/create");
  };

  if (isPublicLoading || (isAuthenticated && isMyLoading)) {
    return (
      <div className="flex justify-center p-12">
        <Loader2 className="size-8 text-surface-300 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 py-4">
      {/* 내 폴더 섹션 */}
      {isAuthenticated && myFolders && myFolders.length > 0 && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between px-4">
            <h2 className="text-xl font-black text-surface-900 dark:text-white flex items-center gap-2">
              <FolderHeart className="size-5 text-primary-500" />
              내 맛탐정 폴더
            </h2>
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-primary-500 font-bold"
              onClick={handleCreateClick}
            >
              <Plus className="size-4 mr-1" />
              새 폴더
            </Button>
          </div>
          <div className="flex flex-col">
            {myFolders.map((folder) => (
              <FolderCard key={folder.id} folder={folder} />
            ))}
          </div>
        </div>
      )}

      {/* 새 폴더 만들기 유도 (내 폴더가 없을 때) */}
      {isAuthenticated && (!myFolders || myFolders.length === 0) && (
        <div className="mx-4 p-8 rounded-2xl bg-surface-50 dark:bg-surface-800/50 border border-dashed border-surface-200 dark:border-surface-700 flex flex-col items-center gap-4 text-center">
          <div className="p-4 rounded-full bg-white dark:bg-surface-800 shadow-sm">
            <Plus className="size-8 text-surface-300" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-surface-900 dark:text-white">나만의 맛집 리스트를 만들어보세요</h3>
            <p className="text-sm text-surface-500 mt-1">함께 보고 싶은 맛집을 폴더로 관리할 수 있습니다.</p>
          </div>
          <Button onClick={handleCreateClick} className="w-full max-w-xs font-bold">
            맛탐정 폴더 만들기
          </Button>
        </div>
      )}

      {/* 비로그인 유저를 위한 안내 */}
      {!isAuthenticated && (
        <div className="mx-4 p-8 rounded-2xl bg-surface-50 dark:bg-surface-800/50 border border-surface-200 dark:border-surface-700 flex flex-col items-center gap-4 text-center">
          <h3 className="text-lg font-bold text-surface-900 dark:text-white">나만의 맛집 리스트를 만들고 싶다면?</h3>
          <Button onClick={openLogin} className="w-full max-w-xs font-bold">
            로그인하고 폴더 만들기
          </Button>
        </div>
      )}

      {/* 공개 폴더 섹션 */}
      <div className="flex flex-col gap-4">
        <div className="px-4">
          <h2 className="text-xl font-black text-surface-900 dark:text-white">추천 맛탐정</h2>
          <p className="text-sm text-surface-500">다른 사용자들이 공유한 맛집 리스트입니다.</p>
        </div>
        <div className="flex flex-col">
          {publicFolders.map((folder) => (
            <FolderCard key={folder.id} folder={folder} />
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
