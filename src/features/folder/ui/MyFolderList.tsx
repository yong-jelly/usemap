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
      {/* 폴더 생성 버튼 */}
      <div className="px-4">
        <Button 
          variant="outline" 
          className="w-full h-12 rounded-xl font-bold gap-2 text-surface-600 border-surface-200"
          onClick={handleCreateClick}
        >
          <FolderPlus className="size-5" />
          새로운 맛탐정 폴더 만들기
        </Button>
      </div>

      {/* 내 폴더 섹션 */}
      <div className="flex flex-col gap-4">
        <div className="px-4">
          <h2 className="text-xl font-black text-surface-900 dark:text-white">내 맛탐정 폴더</h2>
          <p className="text-sm text-surface-500">내가 직접 관리하고 있는 맛집 리스트입니다.</p>
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
