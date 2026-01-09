import { useState } from "react";
import { useNavigate } from "react-router";
import { useCreateFolder } from "@/entities/folder/queries";
import { Button, Input } from "@/shared/ui";
import { ChevronLeft, Lock, Globe, Ghost, Link as LinkIcon, AlertCircle, Loader2, Users, User, Copy, CheckCircle, Clock, X, Key } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import type { CreateFolderResult } from "@/entities/folder/types";

// 초대 코드 생성 완료 모달
function InviteCodeSuccessModal({ 
  data, 
  onClose 
}: { 
  data: CreateFolderResult; 
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const navigate = useNavigate();

  const handleCopy = () => {
    if (data.invite_code) {
      navigator.clipboard.writeText(data.invite_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleGoToFolder = () => {
    navigate(`/folder/${data.id}`, { replace: true });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={onClose}>
      <div 
        className="bg-white dark:bg-surface-900 rounded-3xl w-full max-w-sm p-6 flex flex-col items-center gap-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 rounded-full bg-green-100 dark:bg-green-900/20">
          <CheckCircle className="size-10 text-green-500" />
        </div>
        
        <div className="text-center">
          <h2 className="text-xl font-bold mb-2">폴더가 생성되었습니다!</h2>
          <p className="text-sm text-surface-500">초대 코드를 복사해서 친구들에게 공유하세요.</p>
        </div>

        {/* 초대 코드 표시 */}
        <div className="w-full flex flex-col gap-2">
          <div className="flex items-center justify-center gap-3 p-4 bg-surface-50 dark:bg-surface-800 rounded-2xl">
            <span className="text-3xl font-mono font-black tracking-[0.3em] text-primary-600 dark:text-primary-400">
              {data.invite_code}
            </span>
            <button 
              onClick={handleCopy}
              className={cn(
                "p-2 rounded-xl transition-colors",
                copied 
                  ? "bg-green-100 text-green-600" 
                  : "bg-surface-100 dark:bg-surface-700 hover:bg-surface-200"
              )}
            >
              {copied ? <CheckCircle className="size-5" /> : <Copy className="size-5" />}
            </button>
          </div>
          <div className="flex items-center justify-center gap-1.5 text-xs text-surface-400">
            <Clock className="size-3.5" />
            <span>24시간 후 만료됩니다</span>
          </div>
        </div>

        <div className="w-full flex flex-col gap-2">
          <Button onClick={handleGoToFolder} className="w-full font-bold">
            폴더로 이동
          </Button>
          <Button variant="ghost" onClick={onClose} className="w-full">
            닫기
          </Button>
        </div>
      </div>
    </div>
  );
}

export function FolderCreatePage() {
  const navigate = useNavigate();
  const { mutate: createFolder, isPending } = useCreateFolder();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [permission, setPermission] = useState<'public' | 'private' | 'hidden' | 'invite'>('public');
  const [permissionWriteType, setPermissionWriteType] = useState(0); // 0: 소유자만, 1: 초대자 함께
  const [createdFolderData, setCreatedFolderData] = useState<CreateFolderResult | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || title.length > 20) return;
    if (description.length > 50) return;

    createFolder({
      title,
      description,
      permission,
      permissionWriteType: permission === 'invite' ? permissionWriteType : 0,
    }, {
      onSuccess: (data) => {
        // invite인 경우 초대 코드 모달 표시
        if (data.invite_code) {
          setCreatedFolderData(data);
        } else {
          navigate(`/folder/${data.id}`, { replace: true });
        }
      }
    });
  };

  const permissions = [
    { 
      id: 'public', 
      label: '공개', 
      description: '검색이 가능하며 모든 사용자가 볼 수 있습니다.',
      icon: Globe 
    },
    { 
      id: 'private', 
      label: '비공개 (전용)', 
      description: '본인만 확인하고 관리할 수 있습니다.',
      icon: Lock 
    },
    { 
      id: 'hidden', 
      label: '비공개 (링크)', 
      description: '목록에 노출되지 않지만 링크로 접속 가능합니다.',
      icon: LinkIcon 
    },
    { 
      id: 'invite', 
      label: '비공개 (초대 전용)', 
      description: '초대 코드가 있어야 접속할 수 있습니다.',
      icon: Ghost 
    },
  ];

  const selectedPermission = permissions.find(p => p.id === permission);

  return (
    <div className="flex flex-col min-h-screen bg-white dark:bg-surface-950">
      {/* 헤더 */}
      <div className="sticky top-0 z-10 bg-white dark:bg-surface-950 border-b border-surface-100 dark:border-surface-800 px-4 h-14 flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2">
          <ChevronLeft className="size-6" />
        </button>
        <h1 className="text-lg font-bold">새 맛탐정 폴더</h1>
        <div className="w-10" /> {/* 밸런싱용 */}
      </div>

      <form onSubmit={handleSubmit} className="flex-1 p-6 flex flex-col gap-8 overflow-y-auto">
        {/* 기본 정보 */}
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-bold text-surface-900 dark:text-white">
              폴더 제목 (필수)
            </label>
            <Input 
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="예: 서울 냉면 맛집 지도"
              maxLength={20}
              autoFocus
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

        {/* 공개 여부 설정 */}
        <div className="flex flex-col gap-4">
          <label className="text-sm font-bold text-surface-900 dark:text-white">
            공개 범위
          </label>
          <div className="grid grid-cols-1 gap-3">
            {permissions.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setPermission(p.id as any)}
                className={cn(
                  "flex items-start gap-4 p-4 rounded-2xl border-2 transition-all text-left",
                  permission === p.id 
                    ? "border-primary-500 bg-primary-50/50 dark:bg-primary-900/10" 
                    : "border-surface-100 dark:border-surface-800 hover:border-surface-200 dark:hover:border-surface-700"
                )}
              >
                <div className={cn(
                  "p-2 rounded-xl",
                  permission === p.id 
                    ? "bg-primary-500 text-white" 
                    : "bg-surface-100 dark:bg-surface-800 text-surface-500"
                )}>
                  <p.icon className="size-5" />
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className={cn(
                    "font-bold",
                    permission === p.id ? "text-primary-700 dark:text-primary-400" : "text-surface-900 dark:text-white"
                  )}>
                    {p.label}
                  </span>
                  <span className="text-xs text-surface-500">{p.description}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* 초대 폴더 안내 및 추가 옵션 */}
        {permission === 'invite' && (
          <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="p-4 rounded-2xl bg-primary-50 dark:bg-primary-900/10 border border-primary-100 dark:border-primary-900/20 flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <Key className="size-4 text-primary-500" />
                <span className="text-sm font-bold text-primary-700 dark:text-primary-400">초대 코드 안내</span>
              </div>
              <p className="text-xs text-primary-600 dark:text-primary-300 leading-relaxed font-medium">
                생성 시 5자리의 초대 코드가 자동으로 생성됩니다. 초대 코드는 생성 후 <span className="underline decoration-primary-300 underline-offset-2">24시간 동안만 유효</span>하며, 소유자는 언제든 새로운 코드를 발급할 수 있습니다.
              </p>
            </div>

            <div className="flex flex-col gap-4">
              <label className="text-sm font-bold text-surface-900 dark:text-white">
                편집 권한
              </label>
              <div className="grid grid-cols-1 gap-3">
                <button
                  type="button"
                  onClick={() => setPermissionWriteType(0)}
                  className={cn(
                    "flex items-start gap-4 p-4 rounded-2xl border-2 transition-all text-left",
                    permissionWriteType === 0 
                      ? "border-primary-500 bg-primary-50/50 dark:bg-primary-900/10" 
                      : "border-surface-100 dark:border-surface-800 hover:border-surface-200 dark:hover:border-surface-700"
                  )}
                >
                  <div className={cn(
                    "p-2 rounded-xl",
                    permissionWriteType === 0 
                      ? "bg-primary-500 text-white" 
                      : "bg-surface-100 dark:bg-surface-800 text-surface-500"
                  )}>
                    <User className="size-5" />
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className={cn(
                      "font-bold",
                      permissionWriteType === 0 ? "text-primary-700 dark:text-primary-400" : "text-surface-900 dark:text-white"
                    )}>
                      관리자만 편집
                    </span>
                    <span className="text-xs text-surface-500">초대된 사용자는 보기만 가능합니다.</span>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setPermissionWriteType(1)}
                  className={cn(
                    "flex items-start gap-4 p-4 rounded-2xl border-2 transition-all text-left",
                    permissionWriteType === 1 
                      ? "border-primary-500 bg-primary-50/50 dark:bg-primary-900/10" 
                      : "border-surface-100 dark:border-surface-800 hover:border-surface-200 dark:hover:border-surface-700"
                  )}
                >
                  <div className={cn(
                    "p-2 rounded-xl",
                    permissionWriteType === 1 
                      ? "bg-primary-500 text-white" 
                      : "bg-surface-100 dark:bg-surface-800 text-surface-500"
                  )}>
                    <Users className="size-5" />
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className={cn(
                      "font-bold",
                      permissionWriteType === 1 ? "text-primary-700 dark:text-primary-400" : "text-surface-900 dark:text-white"
                    )}>
                      함께 편집
                    </span>
                    <span className="text-xs text-surface-500">초대된 사용자도 장소를 추가할 수 있습니다.</span>
                  </div>
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="flex items-center gap-2 p-4 rounded-xl bg-amber-50 dark:bg-amber-900/10 text-amber-600 dark:text-amber-400">
          <AlertCircle className="size-5 flex-shrink-0" />
          <p className="text-xs font-medium">생성 후 공개/비공개 상태는 변경할 수 없습니다.</p>
        </div>

        <div className="mt-auto pt-4 pb-8">
          <Button 
            type="submit" 
            size="lg" 
            className="w-full font-bold h-14 text-lg"
            disabled={!title.trim() || isPending}
          >
            {isPending ? <Loader2 className="animate-spin" /> : "폴더 만들기"}
          </Button>
        </div>
      </form>

      {/* 초대 코드 생성 완료 모달 */}
      {createdFolderData && (
        <InviteCodeSuccessModal 
          data={createdFolderData} 
          onClose={() => navigate(`/folder/${createdFolderData.id}`, { replace: true })} 
        />
      )}
    </div>
  );
}
