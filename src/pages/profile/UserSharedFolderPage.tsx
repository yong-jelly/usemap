import { useNavigate, useParams } from "react-router";
import { useUserSharedFolders } from "@/entities/folder/queries";
import { FolderCard } from "@/features/folder/ui/FolderCard";
import { Button } from "@/shared/ui";
import { 
  ChevronLeft, 
  Loader2, 
  FolderHeart
} from "lucide-react";
import { getAvatarUrl } from "@/shared/lib/utils";

export function UserSharedFolderPage() {
  const navigate = useNavigate();
  const { userId } = useParams<{ userId: string }>();
  
  // 특정 사용자의 공개 폴더 목록 조회
  const { 
    data, 
    isLoading, 
    fetchNextPage, 
    hasNextPage, 
    isFetchingNextPage 
  } = useUserSharedFolders(userId || "");

  const folders = data?.pages.flat() || [];

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate("/feed");
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col h-screen bg-white dark:bg-surface-950">
        <header className="flex h-14 items-center px-4 border-b border-surface-100 dark:border-surface-800 shrink-0">
          <button onClick={handleBack} className="p-1.5 -ml-1.5 rounded-full hover:bg-surface-50">
            <ChevronLeft className="h-5 w-5 text-surface-600 dark:text-surface-400" />
          </button>
        </header>
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="size-8 text-primary-500 animate-spin" />
        </div>
      </div>
    );
  }

  const ownerNickname = folders[0]?.owner_nickname || '사용자';
  const ownerAvatar = folders[0]?.owner_avatar_url;

  return (
    <div className="flex flex-col min-h-screen bg-white dark:bg-surface-950">
      {/* 헤더 */}
      <header className="sticky top-0 z-30 flex h-16 items-center px-4 border-b border-surface-100 dark:border-surface-800 shrink-0 bg-white/80 dark:bg-surface-950/80 backdrop-blur-md">
        <button onClick={handleBack} className="p-1.5 -ml-1.5 rounded-full hover:bg-surface-50 shrink-0">
          <ChevronLeft className="h-6 w-6 text-surface-600 dark:text-surface-400" />
        </button>
        
        <div className="flex items-center gap-3 ml-2 flex-1 min-w-0">
          <div className="size-9 rounded-full bg-surface-100 dark:bg-surface-800 overflow-hidden flex-shrink-0 border border-surface-200 dark:border-surface-700">
            {ownerAvatar ? (
              <img src={getAvatarUrl(ownerAvatar)} alt={ownerNickname} className="size-full object-cover" />
            ) : (
              <div className="size-full flex items-center justify-center text-xs font-medium text-surface-400">
                {ownerNickname.charAt(0)}
              </div>
            )}
          </div>
          <div className="flex flex-col min-w-0">
            <h1 className="text-base font-medium text-surface-900 dark:text-surface-50 truncate">
              {ownerNickname}님의 공개 목록
            </h1>
            <p className="text-[11px] font-medium text-surface-500 dark:text-surface-500 uppercase tracking-tight">
              공개 폴더 · {folders.length}개
            </p>
          </div>
        </div>
      </header>

      {/* 컨텐츠 */}
      <div className="flex-1 flex flex-col pb-safe">
        {folders.length > 0 ? (
          <div className="flex flex-col divide-y divide-surface-100 dark:divide-surface-800">
            {folders.map((folder) => (
              <div key={folder.id}>
                <FolderCard folder={folder} showOwner={false} />
              </div>
            ))}
            
            {hasNextPage && (
              <div className="p-6 flex justify-center">
                <Button 
                  variant="ghost" 
                  onClick={() => fetchNextPage()} 
                  disabled={isFetchingNextPage}
                  className="font-medium text-surface-500"
                >
                  {isFetchingNextPage ? <Loader2 className="size-5 animate-spin mr-2" /> : null}
                  더 보기
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center gap-4">
            <div className="size-16 rounded-full bg-surface-50 dark:bg-surface-900 flex items-center justify-center">
              <FolderHeart className="size-8 text-surface-200" />
            </div>
            <div>
              <p className="text-lg font-medium text-surface-900 dark:text-white">공유 중인 폴더가 없습니다</p>
              <p className="text-sm text-surface-500 mt-1">이 사용자가 공개로 설정한 폴더가 아직 없습니다.</p>
            </div>
            <Button 
              onClick={handleBack} 
              variant="outline" 
              className="mt-2 rounded-full font-medium px-8"
            >
              돌아가기
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
