import { useNavigate } from "react-router";
import { useMyFolders } from "@/entities/folder/queries";
import { FolderCard } from "./FolderCard";
import { Button } from "@/shared/ui";
import { Loader2, Plus } from "lucide-react";

export function MyFolderList() {
  const navigate = useNavigate();
  const { data: myFolders, isLoading } = useMyFolders();

  const handleCreateClick = () => {
    navigate("/folder/create");
  };

  if (isLoading) {
    return (
      <div className="flex justify-center p-12">
        <Loader2 className="size-8 text-surface-300 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 py-4">
      <div className="flex items-center justify-between px-4">
        <h2 className="text-lg font-bold text-surface-900 dark:text-white">내 맛탐정 폴더</h2>
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

      {myFolders && myFolders.length > 0 ? (
        <div className="flex flex-col">
          {myFolders.map((folder) => (
            <FolderCard key={folder.id} folder={folder} />
          ))}
        </div>
      ) : (
        <div className="mx-4 p-12 rounded-2xl bg-surface-50 dark:bg-surface-800/50 border border-dashed border-surface-200 dark:border-surface-700 flex flex-col items-center gap-4 text-center">
          <p className="text-surface-500">아직 만든 폴더가 없습니다.</p>
          <Button onClick={handleCreateClick} size="sm" className="font-bold">
            첫 폴더 만들기
          </Button>
        </div>
      )}
    </div>
  );
}
