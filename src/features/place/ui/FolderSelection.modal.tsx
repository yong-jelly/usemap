import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { 
  ChevronLeft,
  Loader2,
  Folder,
  FolderPlus
} from "lucide-react";
import { useMyFolders, useAddPlaceToFolder, useRemovePlaceFromFolder } from "@/entities/folder/queries";
import { FolderListItem } from "@/features/folder/ui/FolderListItem";
import { FolderCreateModal } from "@/features/folder/ui/FolderCreate.modal";
import { Button } from "@/shared/ui";
import { cn } from "@/shared/lib/utils";
import { useNavigate } from "react-router";

interface FolderSelectionModalProps {
  placeId: string;
  onClose: () => void;
  onCloseAll?: () => void;
  onSuccess?: () => void;
}

export function FolderSelectionModal({ placeId, onClose, onCloseAll, onSuccess }: FolderSelectionModalProps) {
  const navigate = useNavigate();
  const { data: folders, isLoading } = useMyFolders({ placeId });
  const addPlaceMutation = useAddPlaceToFolder();
  const removePlaceMutation = useRemovePlaceFromFolder();
  
  const [selectedFolderIds, setSelectedFolderIds] = useState<string[]>([]);
  const [initialFolderIds, setInitialFolderIds] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    if (folders) {
      const inFolders = folders
        .filter(f => f.is_place_in_folder)
        .map(f => f.id);
      setSelectedFolderIds(inFolders);
      setInitialFolderIds(inFolders);
    }
  }, [folders]);

  const toggleFolder = (folderId: string) => {
    setSelectedFolderIds(prev => 
      prev.includes(folderId) 
        ? prev.filter(id => id !== folderId) 
        : [...prev, folderId]
    );
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const toAdd = selectedFolderIds.filter(id => !initialFolderIds.includes(id));
      const toRemove = initialFolderIds.filter(id => !selectedFolderIds.includes(id));

      await Promise.all([
        ...toAdd.map(folderId => addPlaceMutation.mutateAsync({ folderId, placeId })),
        ...toRemove.map(folderId => removePlaceMutation.mutateAsync({ folderId, placeId }))
      ]);

      if (onSuccess) onSuccess();
      onClose();
    } catch (error) {
      console.error("Failed to save folders:", error);
      alert("폴더 저장에 실패했습니다.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateClick = () => {
    setShowCreateModal(true);
  };

  return createPortal(
    <div className="fixed inset-0 z-[110] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      
      <div className={cn(
        "relative w-full h-full bg-white dark:bg-surface-950 flex flex-col",
        "md:max-w-md md:h-[90vh] md:rounded-[32px] md:overflow-hidden md:shadow-2xl"
      )}>
        {/* 헤더 */}
        <header className="flex h-14 items-center px-4 border-b border-surface-100 dark:border-surface-800 shrink-0 bg-white dark:bg-surface-900">
          <button onClick={onClose} className="p-1.5 -ml-1.5 rounded-full hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors">
            <ChevronLeft className="h-5 w-5 text-surface-600 dark:text-surface-400" />
          </button>
          <h1 className="ml-3 text-lg font-bold text-surface-900 dark:text-surface-50">
            내 폴더 저장
          </h1>
          <div className="ml-auto flex items-center gap-1">
            <button 
              onClick={handleSave}
              disabled={isSaving}
              className="px-3 py-1.5 text-sm font-bold text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-950/30 rounded-lg transition-colors disabled:opacity-50"
            >
              {isSaving ? <Loader2 className="size-4 animate-spin" /> : "저장"}
            </button>
          </div>
        </header>

        {/* 폴더 목록 */}
        <div className="flex-1 overflow-y-auto p-4 pb-safe scrollbar-hide flex flex-col gap-4">
          <div className="p-4 rounded-2xl bg-surface-50 dark:bg-surface-900/50 border border-surface-100 dark:border-surface-800 flex items-center justify-between gap-3">
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

          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-full gap-4">
              <Loader2 className="size-8 animate-spin text-primary-500" />
              <span className="text-sm font-medium text-surface-400">폴더 목록 불러오는 중...</span>
            </div>
          ) : folders && folders.length > 0 ? (
            <div className="space-y-3">
              {folders.map(folder => (
                <FolderListItem
                  key={folder.id}
                  folder={folder}
                  isSelected={selectedFolderIds.includes(folder.id)}
                  showCheckbox={true}
                  onClick={toggleFolder}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full gap-4 text-surface-300">
              <Folder className="size-16 opacity-10" />
              <p className="text-lg font-bold">생성된 폴더가 없습니다.</p>
            </div>
          )}
        </div>

        {/* 푸터 */}
        {/* <div className="p-6 border-t border-surface-100 dark:border-surface-800 shrink-0">
          <Button 
            className="w-full h-14 rounded-2xl font-black shadow-lg shadow-primary-100 dark:shadow-none"
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? "저장 중..." : "확인"}
          </Button>
        </div> */}
      </div>

      {showCreateModal && (
        <FolderCreateModal 
          onClose={() => setShowCreateModal(false)} 
        />
      )}
    </div>,
    document.body
  );
}
