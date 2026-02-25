import { useNavigate } from "react-router";
import { useState } from "react";
import { useMyFolders, useHideFolder } from "@/entities/folder/queries";
import { FolderList } from "./FolderList";
import { FolderListOptionsSheet } from "./FolderListOptionsSheet";
import { FolderSettingsSheet } from "./FolderSettingsSheet";
import { FolderCreateModal } from "./FolderCreate.modal";
import { Button, ConfirmDialog } from "@/shared/ui";
import { Loader2 } from "lucide-react";
import type { Folder } from "@/entities/folder/types";

interface MyFolderListProps {
  createModalOpen?: boolean;
  onOpenCreateModal?: () => void;
  onCloseCreateModal?: () => void;
}

export function MyFolderList({
  createModalOpen = false,
  onOpenCreateModal,
  onCloseCreateModal,
}: MyFolderListProps = {}) {
  const navigate = useNavigate();
  const { data: myFolders, isLoading } = useMyFolders();
  const { mutate: hideFolder, isPending: isHiding } = useHideFolder();

  const [selectedFolder, setSelectedFolder] = useState<Folder | null>(null);
  const [showOptions, setShowOptions] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [internalCreateModal, setInternalCreateModal] = useState(false);
  const isCreateModalOpen = onCloseCreateModal ? createModalOpen : internalCreateModal;
  const handleOpenCreate = onOpenCreateModal ?? (() => setInternalCreateModal(true));
  const handleCloseCreate = onCloseCreateModal ?? (() => setInternalCreateModal(false));

  const handleFolderClick = (folderId: string) => {
    navigate(`/folder/${folderId}`);
  };

  const handleMoreClick = (folder: Folder) => {
    setSelectedFolder(folder);
    setShowOptions(true);
  };

  const handleEdit = (folder: Folder) => {
    setSelectedFolder(folder);
    setShowSettings(true);
  };

  const handleShare = (folder: Folder) => {
    if (navigator.share) {
      navigator.share({
        title: folder.title,
        text: folder.description,
        url: `${window.location.origin}/folder/${folder.id}`,
      }).catch(console.error);
    } else {
      // fallback to clipboard
      navigator.clipboard.writeText(`${window.location.origin}/folder/${folder.id}`);
      alert("링크가 복사되었습니다.");
    }
  };

  const handleDelete = () => {
    if (!selectedFolder) return;
    
    hideFolder(selectedFolder.id, {
      onSuccess: () => {
        setShowDeleteConfirm(false);
        setSelectedFolder(null);
      },
      onError: (error: any) => {
        alert(error.message || "폴더 삭제에 실패했습니다.");
      }
    });
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
      <div className="flex flex-col gap-4">
        <div className="px-5">
          {myFolders && myFolders.length > 0 ? (
            <FolderList 
              folders={myFolders} 
              onFolderClick={handleFolderClick}
              showCheckbox={false}
              showMoreOptions={true}
              onMoreClick={handleMoreClick}
            />
          ) : (
            <div className="p-10 rounded-xl bg-surface-50 dark:bg-surface-800/50 border border-dashed border-surface-200 dark:border-surface-700 flex flex-col items-center gap-3 text-center">
              <p className="text-sm text-surface-500">아직 콜렉션이 없습니다.</p>
              <Button onClick={handleOpenCreate} size="sm" className="rounded-full px-5">
                콜렉션 만들기
              </Button>
            </div>
          )}
        </div>
      </div>

      <FolderListOptionsSheet
        isOpen={showOptions}
        onClose={() => setShowOptions(false)}
        folder={selectedFolder}
        onEdit={handleEdit}
        onShare={handleShare}
        onDelete={() => setShowDeleteConfirm(true)}
        dismissible={!showDeleteConfirm}
      />

      {selectedFolder && (
        <FolderSettingsSheet
          isOpen={showSettings}
          onClose={() => setShowSettings(false)}
          folderId={selectedFolder.id}
          folderInfo={selectedFolder}
          onOpenHistory={() => {
            setShowSettings(false);
          }}
        />
      )}

      <ConfirmDialog
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        title="삭제"
        description="정말 이 콜렉션을 숨기시겠습니까? 숨김 처리 후에는 본인을 포함하여 초대된 모든 구성원에게도 콜렉션이 노출되지 않으며 복구할 수 없습니다."
        confirmLabel="삭제"
        cancelLabel="취소"
        onConfirm={handleDelete}
        isLoading={isHiding}
        variant="danger"
      />

      {isCreateModalOpen && (
        <FolderCreateModal onClose={handleCloseCreate} />
      )}
    </div>
  );
}
