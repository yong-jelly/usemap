import { useState, useEffect } from "react";
import { 
  Key, 
  Copy, 
  RefreshCw, 
  History, 
  CheckCircle,
  Clock,
  AlertCircle,
  X,
  Edit3,
  FileText
} from "lucide-react";
import { 
  Drawer, 
  DrawerContent, 
  DrawerHeader, 
  DrawerTitle, 
  DrawerDescription,
  DrawerFooter,
  Button,
  Input,
  ConfirmDialog
} from "@/shared/ui";
import { cn } from "@/shared/lib/utils";
import { ago } from "@/shared/lib/date";
import { 
  useRegenerateInviteCode, 
  useUpdateFolder,
  useFolderInfo
} from "@/entities/folder/queries";
import { useNavigate } from "react-router";

interface FolderSettingsSheetProps {
  isOpen: boolean;
  onClose: () => void;
  folderId: string;
  folderInfo: any;
  onOpenHistory: () => void;
}

export function FolderSettingsSheet({
  isOpen,
  onClose,
  folderId,
  folderInfo,
  onOpenHistory,
}: FolderSettingsSheetProps) {
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  const [showRegenerateConfirm, setShowRegenerateConfirm] = useState(false);
  const [title, setTitle] = useState(folderInfo?.title || "");
  const [description, setDescription] = useState(folderInfo?.description || "");
  const { mutate: regenerate, isPending: isRegenerating } = useRegenerateInviteCode();
  const { mutate: updateFolder, isPending: isUpdating } = useUpdateFolder();
  const { data: fetchedFolderInfo } = useFolderInfo(folderId);

  const currentFolder = fetchedFolderInfo || folderInfo;

  const isExpired = currentFolder?.invite_code_expires_at 
    ? new Date(currentFolder.invite_code_expires_at) < new Date() 
    : true;

  const handleCopy = () => {
    if (currentFolder?.invite_code) {
      navigator.clipboard.writeText(currentFolder.invite_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleRegenerate = () => {
    setShowRegenerateConfirm(true);
  };

  const handleConfirmRegenerate = () => {
    regenerate(folderId, {
      onSuccess: () => {
        setShowRegenerateConfirm(false);
      }
    });
  };

  const handleSaveTitleAndDescription = () => {
    if (!title.trim() || title.length > 20) return;
    if (description.length > 50) return;

    updateFolder({
      folderId,
      title: title.trim(),
      description: description.trim() || undefined,
    }, {
      onSuccess: () => {
        onClose();
      }
    });
  };

  // folderInfo가 변경되면 로컬 state 업데이트
  useEffect(() => {
    if (currentFolder) {
      setTitle(currentFolder.title || "");
      setDescription(currentFolder.description || "");
    }
  }, [currentFolder]);

  const isSaveDisabled = !title.trim() || title.length > 20 || description.length > 50 || isUpdating;

  return (
    <>
      <Drawer 
        open={isOpen} 
        onOpenChange={(open) => !open && onClose()}
        dismissible={!showRegenerateConfirm}
      >
        <DrawerContent className="bg-white dark:bg-surface-900 border-t-2 border-[#2B4562]/10 shadow-none rounded-t-[32px] max-w-lg mx-auto max-h-[90vh]">
          <DrawerHeader className="px-6 py-5 relative flex items-center justify-center">
            <DrawerTitle className="text-lg font-black text-surface-900 dark:text-white text-center">
              폴더 설정
            </DrawerTitle>
            <DrawerDescription className="sr-only">
              폴더의 이름과 설명을 수정하거나 초대 코드를 관리할 수 있습니다.
            </DrawerDescription>
            <button 
              onClick={onClose}
              className="absolute right-6 p-2 -mr-2 text-surface-400 hover:text-surface-600 transition-colors"
            >
              <X className="size-6" />
            </button>
          </DrawerHeader>

          <div className="mx-6 border-b border-surface-100 dark:border-surface-800" />

          <div className="flex-1 overflow-y-auto px-6 py-8 flex flex-col gap-8">
            {/* 기본 정보 수정 섹션 */}
            <div className="flex flex-col gap-6">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-primary-50 dark:bg-primary-900/20 rounded-xl">
                  <Edit3 className="size-5 text-primary-500" />
                </div>
                <div className="flex flex-col">
                  <span className="text-base font-bold text-surface-900 dark:text-white">기본 정보</span>
                  <span className="text-xs text-surface-500 font-medium">폴더의 제목과 설명을 수정할 수 있습니다.</span>
                </div>
              </div>

              <div className="flex flex-col gap-6">
                {/* 제목 입력 */}
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-bold text-surface-900 dark:text-white">
                    폴더 제목 (필수)
                  </label>
                  <Input 
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="예: 서울 냉면 맛집 지도"
                    maxLength={20}
                    className="text-lg font-bold"
                  />
                  <div className="flex justify-end">
                    <span className={cn(
                      "text-xs font-medium",
                      title.length > 20 ? "text-red-500" : "text-surface-400"
                    )}>
                      {title.length}/20
                    </span>
                  </div>
                </div>

                {/* 설명 입력 */}
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-bold text-surface-900 dark:text-white">
                    설명
                  </label>
                  <textarea 
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="이 폴더에 대해 설명해주세요."
                    maxLength={50}
                    className="w-full p-4 rounded-xl bg-surface-50 dark:bg-surface-900 border border-surface-100 dark:border-surface-800 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all resize-none h-24"
                  />
                  <div className="flex justify-end">
                    <span className={cn(
                      "text-xs font-medium",
                      description.length > 50 ? "text-red-500" : "text-surface-400"
                    )}>
                      {description.length}/50
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* 초대 코드 관리 섹션 */}
            {currentFolder?.permission === 'invite' && (
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-primary-50 dark:bg-primary-900/20 rounded-xl">
                      <Key className="size-5 text-primary-500" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-base font-bold text-surface-900 dark:text-white">초대 코드 관리</span>
                      <span className="text-xs text-surface-500 font-medium">코드를 공유하여 구성원을 초대하세요.</span>
                    </div>
                  </div>
                  <button 
                    onClick={onOpenHistory}
                    className="px-3 py-1.5 bg-surface-50 dark:bg-surface-800 rounded-xl text-xs font-bold text-surface-600 dark:text-surface-300 flex items-center gap-1.5 hover:bg-surface-100 transition-colors"
                  >
                    <History className="size-3.5" />
                    히스토리
                  </button>
                </div>

                <div className="bg-surface-50 dark:bg-surface-800/50 rounded-2xl p-5 border border-surface-100 dark:border-surface-800 flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[10px] font-bold text-surface-400 uppercase tracking-tight">Current Code</span>
                      <span className={cn(
                        "font-mono font-black tracking-[0.2em] text-3xl",
                        isExpired ? "text-surface-300" : "text-primary-600 dark:text-primary-400"
                      )}>
                        {currentFolder.invite_code || 'NONE'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {currentFolder.invite_code && (
                        <button 
                          onClick={handleCopy} 
                          className={cn(
                            "p-3 rounded-2xl transition-all border-2",
                            copied 
                              ? "bg-green-50 border-green-200 text-green-600" 
                              : "bg-white dark:bg-surface-800 border-surface-100 dark:border-surface-700 text-surface-400 hover:border-primary-200 hover:text-primary-500"
                          )}
                        >
                          {copied ? <CheckCircle className="size-6" /> : <Copy className="size-6" />}
                        </button>
                      )}
                      <button 
                        onClick={handleRegenerate}
                        disabled={isRegenerating}
                        className="p-3 bg-white dark:bg-surface-800 border-2 border-surface-100 dark:border-surface-700 rounded-2xl text-primary-500 transition-all hover:border-primary-200 disabled:opacity-50"
                        title="새 코드 생성"
                      >
                        <RefreshCw className={cn("size-6", isRegenerating && "animate-spin")} />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-t border-surface-100 dark:border-surface-800 pt-3">
                    <div className="flex items-center gap-1.5 text-xs font-bold">
                      {isExpired ? (
                        <span className="text-red-500 flex items-center gap-1">
                          <AlertCircle className="size-3.5" />
                          코드가 만료되었습니다
                        </span>
                      ) : (
                        <span className="text-primary-600 dark:text-primary-400 flex items-center gap-1">
                          <Clock className="size-3.5" />
                          {currentFolder.invite_code_expires_at ? ago(currentFolder.invite_code_expires_at) : ''} 후 만료
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-surface-400 font-bold">
                      24시간마다 갱신 필요
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <DrawerFooter className="p-6">
            <Button 
              onClick={handleSaveTitleAndDescription}
              disabled={isSaveDisabled}
              className="w-full py-7 rounded-2xl font-black text-xl bg-primary-500 hover:bg-primary-600 text-white border-b-4 border-primary-600 active:border-b-0 active:translate-y-[2px] transition-all shadow-none"
            >
              {isUpdating ? <RefreshCw className="size-5 animate-spin mr-2" /> : "완료"}
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      <ConfirmDialog
        open={showRegenerateConfirm}
        onOpenChange={setShowRegenerateConfirm}
        title="초대 코드 생성"
        description={isExpired 
          ? "새로운 초대 코드를 생성하시겠습니까?" 
          : "새로운 초대 코드를 생성하시겠습니까? 기존 코드는 즉시 만료됩니다."}
        confirmLabel="생성"
        cancelLabel="취소"
        onConfirm={handleConfirmRegenerate}
        isLoading={isRegenerating}
        variant="danger"
      />
    </>
  );
}
