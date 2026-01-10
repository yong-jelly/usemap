import { useNavigate } from "react-router";
import { useMyFolders } from "@/entities/folder/queries";
import { FolderList } from "./FolderList";
import { Button } from "@/shared/ui";
import { Loader2, FolderPlus } from "lucide-react";

export function MyFolderList() {
  const navigate = useNavigate();
  const { data: myFolders, isLoading } = useMyFolders();

  const handleCreateClick = () => {
    navigate("/folder/create");
  };

  const handleFolderClick = (folderId: string) => {
    navigate(`/folder/${folderId}`);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center p-12">
        <Loader2 className="size-8 text-surface-300 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 py-4">
      {/* 내 폴더 섹션 */}
      <div className="flex flex-col gap-4">
        <div className="mx-4 p-4 rounded-2xl bg-surface-50 dark:bg-surface-900/50 border border-surface-100 dark:border-surface-800 flex items-center justify-between gap-3">
          <div className="flex flex-col gap-0.5">
            <h2 className="text-sm font-bold text-surface-900 dark:text-white leading-tight">내 맛탐정 폴더</h2>
            <p className="text-xs text-surface-500 dark:text-surface-400 leading-relaxed">내가 직접 관리하고 있는 맛집 리스트입니다.</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button 
              variant="outline" 
              size="sm"
              className="rounded-full font-bold gap-1.5 bg-white dark:bg-surface-800 text-surface-600 border-surface-200 h-9 px-3 shadow-sm"
              onClick={handleCreateClick}
            >
              <FolderPlus className="size-4" />
              <span className="text-xs">맛탐정 생성</span>
            </Button>
          </div>
        </div>

        <div className="px-4">
          {myFolders && myFolders.length > 0 ? (
            <FolderList 
              folders={myFolders} 
              onFolderClick={handleFolderClick}
              showCheckbox={false}
            />
          ) : (
            <div className="p-12 rounded-2xl bg-surface-50 dark:bg-surface-800/50 border border-dashed border-surface-200 dark:border-surface-700 flex flex-col items-center gap-4 text-center mt-2">
              <p className="text-sm text-surface-500 font-medium">아직 만든 폴더가 없습니다.</p>
              <Button onClick={handleCreateClick} size="sm" className="font-bold rounded-full px-6">
                첫 폴더 만들기
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
