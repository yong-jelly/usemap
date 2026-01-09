import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { 
  ChevronLeft,
  Settings, 
  Check, 
  Loader2,
  Folder,
  Globe,
  Lock,
  Link as LinkIcon,
  Ghost,
  User,
  Users
} from "lucide-react";
import { useMyFolders, useAddPlaceToFolder, useRemovePlaceFromFolder } from "@/entities/folder/queries";
import { Button } from "@/shared/ui";
import { cn } from "@/shared/lib/utils";
import { useNavigate } from "react-router";
import type { FolderPermission } from "@/entities/folder/types";

interface FolderSelectionModalProps {
  placeId: string;
  onClose: () => void;
  onCloseAll?: () => void;
  onSuccess?: () => void;
}

const PERMISSION_INFO: Record<FolderPermission, { label: string; icon: any }> = {
  public: { 
    label: '공개', 
    icon: Globe
  },
  private: { 
    label: '비공개 (전용)', 
    icon: Lock
  },
  hidden: { 
    label: '비공개 (링크)', 
    icon: LinkIcon
  },
  invite: { 
    label: '비공개 (초대 전용)', 
    icon: Ghost
  },
  default: { 
    label: '기본 폴더', 
    icon: User
  }
};

export function FolderSelectionModal({ placeId, onClose, onCloseAll, onSuccess }: FolderSelectionModalProps) {
  const navigate = useNavigate();
  const { data: folders, isLoading } = useMyFolders({ placeId });
  const addPlaceMutation = useAddPlaceToFolder();
  const removePlaceMutation = useRemovePlaceFromFolder();
  
  const [selectedFolderIds, setSelectedFolderIds] = useState<string[]>([]);
  const [initialFolderIds, setInitialFolderIds] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);

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

  const goToFolderSettings = () => {
    if (onCloseAll) onCloseAll();
    onClose();
    navigate('/profile/folder');
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
            <button 
              onClick={goToFolderSettings}
              className="p-2 rounded-full hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors text-surface-600 dark:text-surface-400"
            >
              <Settings className="size-5" />
            </button>
          </div>
        </header>

        {/* 폴더 목록 */}
        <div className="flex-1 overflow-y-auto p-4 pb-safe scrollbar-hide">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-full gap-4">
              <Loader2 className="size-8 animate-spin text-primary-500" />
              <span className="text-sm font-medium text-surface-400">폴더 목록 불러오는 중...</span>
            </div>
          ) : folders && folders.length > 0 ? (
            <div className="space-y-3">
              {folders.map(folder => {
                const info = PERMISSION_INFO[folder.permission] || PERMISSION_INFO.public;
                const Icon = info.icon;
                const isCollaborative = folder.permission === 'invite' && folder.permission_write_type === 1;

                return (
                  <button
                    key={folder.id}
                    onClick={() => toggleFolder(folder.id)}
                    className={cn(
                      "w-full flex items-center justify-between p-4 rounded-3xl transition-colors text-left border-2",
                      selectedFolderIds.includes(folder.id)
                        ? "bg-primary-50/50 dark:bg-primary-900/10 border-primary-500/50"
                        : "bg-white dark:bg-surface-900 border-surface-50 dark:border-surface-800 hover:bg-surface-50 dark:hover:bg-surface-800 shadow-sm"
                    )}
                  >
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "size-12 rounded-2xl flex items-center justify-center shrink-0",
                        selectedFolderIds.includes(folder.id)
                          ? "bg-primary-500 text-white"
                          : "bg-surface-100 dark:bg-surface-800 text-surface-500"
                      )}>
                        <Icon className="size-6" />
                      </div>
                      <div className="flex flex-col gap-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className={cn(
                            "text-base font-bold truncate",
                            selectedFolderIds.includes(folder.id) ? "text-primary-900 dark:text-primary-100" : "text-surface-900 dark:text-white"
                          )}>
                            {folder.title}
                          </p>
                          {isCollaborative && (
                            <div className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-green-100 dark:bg-green-900/30 text-[10px] font-bold text-green-600 dark:text-green-400 shrink-0">
                              <Users className="size-3" />
                              함께 편집
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-surface-500">
                            {info.label}
                          </span>
                          <span className="size-1 rounded-full bg-surface-200 dark:bg-surface-700 shrink-0" />
                          <span className="text-xs font-medium text-surface-400 shrink-0">
                            장소 {folder.place_count}개
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className={cn(
                      "size-7 rounded-full border-2 flex items-center justify-center transition-all shrink-0",
                      selectedFolderIds.includes(folder.id)
                        ? "bg-primary-600 border-primary-600 shadow-sm"
                        : "border-surface-200 dark:border-surface-700"
                    )}>
                      {selectedFolderIds.includes(folder.id) && (
                        <Check className="size-4 text-white stroke-[3]" />
                      )}
                    </div>
                  </button>
                );
              })}
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
    </div>,
    document.body
  );
}
