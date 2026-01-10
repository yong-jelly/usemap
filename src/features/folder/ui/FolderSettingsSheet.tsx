import { useState } from "react";
import { 
  Key, 
  EyeOff, 
  Copy, 
  RefreshCw, 
  History, 
  CheckCircle,
  Clock,
  AlertCircle,
  X
} from "lucide-react";
import { 
  Drawer, 
  DrawerContent, 
  DrawerHeader, 
  DrawerTitle, 
  DrawerFooter,
  Button 
} from "@/shared/ui";
import { cn, formatKoreanDate } from "@/shared/lib/utils";
import { ago } from "@/shared/lib/date";
import { 
  useRegenerateInviteCode, 
  useHideFolder 
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
  const { mutate: regenerate, isPending: isRegenerating } = useRegenerateInviteCode();
  const { mutate: hideFolder, isPending: isHiding } = useHideFolder();

  const isExpired = folderInfo?.invite_code_expires_at 
    ? new Date(folderInfo.invite_code_expires_at) < new Date() 
    : true;

  const handleCopy = () => {
    if (folderInfo?.invite_code) {
      navigator.clipboard.writeText(folderInfo.invite_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleRegenerate = () => {
    if (window.confirm('새로운 초대 코드를 생성하시겠습니까? 기존 코드는 즉시 만료됩니다.')) {
      regenerate(folderId);
    }
  };

  const handleHide = () => {
    if (window.confirm('정말 이 폴더를 숨기시겠습니까?\n\n이 기능은 삭제에 준하는 기능으로, 숨김 처리 후에는 본인을 포함하여 초대된 모든 구성원에게도 폴더가 노출되지 않으며 복구할 수 없습니다.')) {
      hideFolder(folderId, {
        onSuccess: () => {
          onClose();
          navigate('/profile', { replace: true });
        }
      });
    }
  };

  return (
    <Drawer open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DrawerContent className="bg-white dark:bg-surface-900 border-t-2 border-[#2B4562]/10 shadow-none rounded-t-[32px] max-w-lg mx-auto max-h-[90vh]">
        <DrawerHeader className="px-6 pt-8 pb-4">
          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-1">
              <DrawerTitle className="text-2xl font-black text-surface-900 dark:text-white">폴더 설정</DrawerTitle>
              <p className="text-sm text-surface-500 font-medium">폴더의 공개 범위와 초대 코드를 관리합니다.</p>
            </div>
            <button onClick={onClose} className="p-2 -mr-2 text-surface-400 hover:text-surface-600">
              <X className="size-6" />
            </button>
          </div>
        </DrawerHeader>

        <div className="flex-1 overflow-y-auto px-6 py-4 flex flex-col gap-8">
          {/* 초대 코드 관리 섹션 */}
          {folderInfo?.permission === 'invite' && (
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
                      {folderInfo.invite_code || 'NONE'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {folderInfo.invite_code && (
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
                        {folderInfo.invite_code_expires_at ? ago(folderInfo.invite_code_expires_at) : ''} 후 만료
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

          {/* 위험 구역 - 숨김 기능 */}
          {folderInfo?.permission !== 'default' && (
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-red-50 dark:bg-red-900/20 rounded-xl">
                  <EyeOff className="size-5 text-red-500" />
                </div>
                <div className="flex flex-col">
                  <span className="text-base font-bold text-surface-900 dark:text-white">폴더 숨기기</span>
                  <span className="text-xs text-red-500 font-bold">삭제에 준하는 강력한 기능입니다.</span>
                </div>
              </div>

              <div className="bg-red-50/50 dark:bg-red-900/10 rounded-2xl p-5 border border-red-100 dark:border-red-900/20 flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <p className="text-sm text-red-600 dark:text-red-400 font-bold leading-relaxed">
                    ⚠️ 숨김 처리 시 주의사항
                  </p>
                  <ul className="text-xs text-red-600/70 dark:text-red-400/70 font-medium space-y-1.5 list-disc ml-4">
                    <li>모든 목록에서 폴더가 즉시 사라집니다.</li>
                    <li>본인을 포함한 모든 구성원이 더 이상 접근할 수 없습니다.</li>
                    <li>구독 중인 사용자들의 목록에서도 즉시 삭제됩니다.</li>
                    <li>한 번 숨겨진 폴더는 다시 복구할 수 없습니다.</li>
                  </ul>
                </div>
                
                <Button 
                  variant="destructive" 
                  onClick={handleHide}
                  disabled={isHiding}
                  className="w-full py-6 rounded-2xl font-black text-lg border-b-4 border-red-700 active:border-b-0 active:translate-y-[2px] transition-all shadow-none"
                >
                  {isHiding ? <RefreshCw className="size-5 animate-spin mr-2" /> : <EyeOff className="size-5 mr-2" />}
                  폴더 숨기기
                </Button>
              </div>
            </div>
          )}
        </div>

        <DrawerFooter className="p-6">
          <Button 
            variant="outline" 
            onClick={onClose}
            className="w-full py-6 rounded-2xl font-black text-lg border-2 border-surface-100 dark:border-surface-800"
          >
            닫기
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
