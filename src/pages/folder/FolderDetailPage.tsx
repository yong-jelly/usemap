import { useState } from "react";
import { useParams, useNavigate } from "react-router";
import { 
  useFolderPlaces, 
  useAddPlaceToFolder, 
  useFolderInfo, 
  useFolderAccess,
  useVerifyInviteCode,
  useRegenerateInviteCode,
  useInviteHistory,
  useHideFolder,
  useRemovePlaceFromFolder
} from "@/entities/folder/queries";
import { Button, PlaceSliderCard, Input } from "@/shared/ui";
import { 
  ChevronLeft, 
  Plus, 
  Loader2, 
  Share2, 
  MoreVertical,
  Map as MapIcon,
  LayoutGrid,
  Users,
  User,
  Info,
  Key,
  Copy,
  RefreshCw,
  Clock,
  History,
  Settings,
  EyeOff,
  Trash2,
  X,
  CheckCircle,
  AlertCircle
} from "lucide-react";
import { PlaceSearchModal } from "@/features/folder/ui/PlaceSearchModal";
import { FolderReviewSection } from "@/features/folder/ui/FolderReviewSection";
import { usePlacePopup } from "@/shared/lib/place-popup";
import { cn, formatKoreanDate } from "@/shared/lib/utils";
import { ago } from "@/shared/lib/date";
import { useUserStore } from "@/entities/user";
import { useAuthModalStore } from "@/features/auth/model/useAuthModalStore";
import type { FolderAccess, InviteHistory as InviteHistoryType } from "@/entities/folder/types";

// 초대 관리 섹션 (폴더 상세 상단에 표시)
function FolderInviteAdminSection({ 
  folderId, 
  inviteCode, 
  expiresAt,
  onOpenHistory 
}: { 
  folderId: string; 
  inviteCode?: string; 
  expiresAt?: string;
  onOpenHistory: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const isExpired = expiresAt ? new Date(expiresAt) < new Date() : true;
  const { mutate: regenerate, isPending } = useRegenerateInviteCode();

  const handleCopy = () => {
    if (inviteCode) {
      navigator.clipboard.writeText(inviteCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleRegenerate = () => {
    if (window.confirm('새로운 초대 코드를 생성하시겠습니까? 기존 코드는 즉시 만료됩니다.')) {
      regenerate(folderId);
    }
  };

  return (
    <div className="mx-5 mb-6 p-5 bg-primary-50 dark:bg-primary-900/10 rounded-2xl border border-primary-100 dark:border-primary-900/20 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-primary-500 rounded-lg">
            <Key className="size-4 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-bold text-primary-700 dark:text-primary-400">초대 코드 관리</span>
            <span className="text-[10px] text-primary-600/60 dark:text-primary-400/60 font-medium">관리자 전용</span>
          </div>
        </div>
        <button 
          onClick={onOpenHistory}
          className="px-3 py-1.5 bg-white dark:bg-surface-800 rounded-xl shadow-sm text-xs font-bold text-surface-600 dark:text-surface-300 flex items-center gap-1.5 hover:bg-surface-50 transition-colors"
        >
          <History className="size-3.5" />
          히스토리
        </button>
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <div className="flex-1 bg-white dark:bg-surface-800 rounded-xl px-4 py-4 flex items-center justify-between shadow-sm border border-primary-100/50 dark:border-primary-900/20">
            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] font-bold text-surface-400 uppercase tracking-tight">Current Code</span>
              <span className={cn(
                "font-mono font-black tracking-[0.2em] text-2xl",
                isExpired ? "text-surface-400" : "text-primary-600 dark:text-primary-400"
              )}>
                {inviteCode || 'NONE'}
              </span>
            </div>
            <div className="flex items-center gap-1">
              {inviteCode && (
                <button 
                  onClick={handleCopy} 
                  className={cn(
                    "p-2.5 rounded-xl transition-all",
                    copied ? "bg-green-50 text-green-600" : "hover:bg-surface-50 text-surface-400"
                  )}
                >
                  {copied ? <CheckCircle className="size-5" /> : <Copy className="size-5" />}
                </button>
              )}
              <button 
                onClick={handleRegenerate}
                disabled={isPending}
                className="p-2.5 rounded-xl hover:bg-surface-50 text-primary-500 transition-all disabled:opacity-50"
                title="새 코드 생성"
              >
                <RefreshCw className={cn("size-5", isPending && "animate-spin")} />
              </button>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-1.5 text-xs font-medium">
            {isExpired ? (
              <span className="text-red-500 flex items-center gap-1">
                <AlertCircle className="size-3.5" />
                코드가 만료되었습니다
              </span>
            ) : (
              <span className="text-primary-600 dark:text-primary-400 flex items-center gap-1">
                <Clock className="size-3.5" />
                {expiresAt ? ago(expiresAt) : ''} 후 만료
              </span>
            )}
          </div>
          <span className="text-[10px] text-surface-400 font-medium">
            24시간마다 갱신 필요
          </span>
        </div>
      </div>
    </div>
  );
}

// 초대 코드 입력 UI
function InviteCodeInput({ 
  folderId, 
  onSuccess 
}: { 
  folderId: string; 
  onSuccess: () => void;
}) {
  const [code, setCode] = useState("");
  const { mutate: verifyCode, isPending, error } = useVerifyInviteCode();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length !== 5) return;

    verifyCode({ folderId, inviteCode: code }, {
      onSuccess: (result) => {
        if (result.success) {
          onSuccess();
        } else {
          const errorMessages: Record<string, string> = {
            'LOGIN_REQUIRED': '로그인이 필요합니다.',
            'FOLDER_NOT_FOUND': '폴더를 찾을 수 없습니다.',
            'INVALID_CODE': '초대 코드가 올바르지 않습니다.',
            'CODE_EXPIRED': '초대 코드가 만료되었습니다.',
          };
          setErrorMsg(errorMessages[result.error || ''] || '알 수 없는 오류가 발생했습니다.');
        }
      },
      onError: () => {
        setErrorMsg('오류가 발생했습니다. 다시 시도해주세요.');
      }
    });
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center">
      <div className="p-6 rounded-full bg-primary-100 dark:bg-primary-900/20 mb-6">
        <Key className="size-12 text-primary-500" />
      </div>
      <h2 className="text-2xl font-bold mb-2">초대 코드 입력</h2>
      <p className="text-surface-500 mb-8">이 폴더에 접근하려면 초대 코드가 필요합니다.</p>
      
      <form onSubmit={handleSubmit} className="w-full max-w-xs flex flex-col gap-4">
        <Input
          value={code}
          onChange={(e) => {
            setCode(e.target.value.toUpperCase().slice(0, 5));
            setErrorMsg(null);
          }}
          placeholder="5자리 코드 입력"
          maxLength={5}
          className="text-center text-2xl font-mono tracking-[0.5em] uppercase"
        />
        {errorMsg && (
          <p className="text-red-500 text-sm font-medium">{errorMsg}</p>
        )}
        <Button type="submit" disabled={code.length !== 5 || isPending} className="font-bold">
          {isPending ? <Loader2 className="animate-spin" /> : "입장하기"}
        </Button>
      </form>
    </div>
  );
}

// 초대 히스토리 모달
function InviteHistoryModal({ 
  folderId, 
  onClose 
}: { 
  folderId: string; 
  onClose: () => void;
}) {
  const { data: history, isLoading } = useInviteHistory(folderId);
  const { mutate: regenerate, isPending } = useRegenerateInviteCode();
  const { data: folderInfo } = useFolderInfo(folderId);

  const handleRegenerate = () => {
    regenerate(folderId, {
      onSuccess: (result) => {
        alert(`새 초대 코드: ${result.invite_code}\n(24시간 유효)`);
      }
    });
  };

  const copyCode = () => {
    if (folderInfo?.invite_code) {
      navigator.clipboard.writeText(folderInfo.invite_code);
      alert('초대 코드가 복사되었습니다.');
    }
  };

  const isExpired = folderInfo?.invite_code_expires_at 
    ? new Date(folderInfo.invite_code_expires_at) < new Date() 
    : true;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center" onClick={onClose}>
      <div 
        className="bg-white dark:bg-surface-900 w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b border-surface-100 dark:border-surface-800 flex items-center justify-between">
          <h3 className="text-lg font-bold">초대 코드 관리</h3>
          <button onClick={onClose} className="p-2 -mr-2">
            <X className="size-5" />
          </button>
        </div>

        <div className="p-4 flex-1 overflow-y-auto flex flex-col gap-6">
          {/* 현재 코드 */}
          <div className="flex flex-col gap-3">
            <h4 className="text-sm font-bold text-surface-500">현재 초대 코드</h4>
            {folderInfo?.invite_code && !isExpired ? (
              <div className="flex items-center gap-2">
                <div className="flex-1 p-4 bg-surface-50 dark:bg-surface-800 rounded-xl font-mono text-2xl tracking-widest text-center">
                  {folderInfo.invite_code}
                </div>
                <Button variant="outline" size="icon" onClick={copyCode}>
                  <Copy className="size-4" />
                </Button>
              </div>
            ) : (
              <div className="p-4 bg-surface-50 dark:bg-surface-800 rounded-xl text-center text-surface-400">
                {isExpired ? '코드가 만료되었습니다' : '코드가 없습니다'}
              </div>
            )}
            {folderInfo?.invite_code_expires_at && (
              <div className="flex items-center gap-1.5 text-xs text-surface-400">
                <Clock className="size-3.5" />
                만료: {formatKoreanDate(folderInfo.invite_code_expires_at)}
              </div>
            )}
            <Button 
              variant="outline" 
              onClick={handleRegenerate} 
              disabled={isPending}
              className="gap-2"
            >
              <RefreshCw className={cn("size-4", isPending && "animate-spin")} />
              새 코드 생성 (24시간 유효)
            </Button>
          </div>

          {/* 히스토리 */}
          <div className="flex flex-col gap-3">
            <h4 className="text-sm font-bold text-surface-500 flex items-center gap-1.5">
              <History className="size-4" />
              초대 히스토리
            </h4>
            {isLoading ? (
              <div className="flex justify-center py-4">
                <Loader2 className="size-5 animate-spin text-surface-300" />
              </div>
            ) : history && history.length > 0 ? (
              <div className="flex flex-col gap-2">
                {history.map((item: InviteHistoryType) => (
                  <div key={item.id} className="p-3 bg-surface-50 dark:bg-surface-800 rounded-xl flex items-center justify-between">
                    <div className="flex flex-col gap-0.5">
                      <span className="font-mono text-sm">{item.invite_code}</span>
                      <span className="text-xs text-surface-400">
                        {item.invited_user_nickname 
                          ? `${item.invited_user_nickname} 수락` 
                          : item.status === 'expired' 
                            ? '만료됨' 
                            : '대기 중'}
                      </span>
                    </div>
                    <span className={cn(
                      "text-xs px-2 py-0.5 rounded-full font-medium",
                      item.status === 'accepted' 
                        ? "bg-green-100 text-green-600" 
                        : item.status === 'expired' 
                          ? "bg-surface-200 text-surface-500" 
                          : "bg-amber-100 text-amber-600"
                    )}>
                      {item.status === 'accepted' ? '수락' : item.status === 'expired' ? '만료' : '대기'}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-surface-400 text-center py-4">히스토리가 없습니다.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function FolderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { show: showPlaceModal } = usePlacePopup();
  const { isAuthenticated, user } = useUserStore();
  const { openLogin } = useAuthModalStore();
  
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'map'>('grid');
  const [showInviteHistory, setShowInviteHistory] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  // 접근 권한 체크
  const { data: access, isLoading: isAccessLoading, refetch: refetchAccess } = useFolderAccess(id!);

  const { 
    data: placesData, 
    fetchNextPage, 
    hasNextPage, 
    isFetchingNextPage, 
    isLoading: isPlacesLoading 
  } = useFolderPlaces(id!);

  const { data: folderInfo, isLoading: isInfoLoading } = useFolderInfo(id!);
  const { mutate: addPlace } = useAddPlaceToFolder();
  const { mutate: removePlace } = useRemovePlaceFromFolder();
  const { mutate: hideFolder } = useHideFolder();

  const isOwner = access?.is_owner;
  const canEdit = access?.can_edit;

  const handleAddPlace = (place: any) => {
    addPlace({ folderId: id!, placeId: place.id }, {
      onSuccess: () => {
        setIsSearchOpen(false);
      }
    });
  };

  const handleHideFolder = () => {
    if (window.confirm('정말 이 폴더를 숨기시겠습니까? 구독자들은 더 이상 접근할 수 없습니다.')) {
      hideFolder(id!, {
        onSuccess: () => {
          navigate('/profile', { replace: true });
        }
      });
    }
    setShowMenu(false);
  };

  // 로딩 상태
  if (isAccessLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="size-8 animate-spin text-surface-300" />
      </div>
    );
  }

  // 404 케이스
  if (access?.access === 'NOT_FOUND') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center">
        <h2 className="text-2xl font-bold mb-2">폴더를 찾을 수 없습니다</h2>
        <p className="text-surface-500 mb-8">존재하지 않거나 비공개된 폴더입니다.</p>
        <Button onClick={() => navigate("/feature?tab=detective")} className="font-bold">
          맛탐정 목록으로 이동
        </Button>
      </div>
    );
  }

  // 초대 코드 필요 케이스
  if (access?.access === 'INVITE_CODE_REQUIRED') {
    if (!isAuthenticated) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center">
          <div className="p-6 rounded-full bg-primary-100 dark:bg-primary-900/20 mb-6">
            <Key className="size-12 text-primary-500" />
          </div>
          <h2 className="text-2xl font-bold mb-2">로그인이 필요합니다</h2>
          <p className="text-surface-500 mb-8">이 폴더에 접근하려면 로그인 후 초대 코드를 입력해주세요.</p>
          <Button onClick={() => openLogin()} className="font-bold">
            로그인하기
          </Button>
        </div>
      );
    }
    return (
      <InviteCodeInput 
        folderId={id!} 
        onSuccess={() => refetchAccess()} 
      />
    );
  }

  // 접근 허용됐으나 데이터 로딩 중
  if (isPlacesLoading || isInfoLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="size-8 animate-spin text-surface-300" />
      </div>
    );
  }

  if (!folderInfo) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center">
        <h2 className="text-2xl font-bold mb-2">폴더를 찾을 수 없습니다</h2>
        <p className="text-surface-500 mb-8">존재하지 않거나 비공개된 폴더입니다.</p>
        <Button onClick={() => navigate("/feature?tab=detective")} className="font-bold">
          맛탐정 목록으로 이동
        </Button>
      </div>
    );
  }

  const places = placesData?.pages.flatMap(page => page) || [];
  const isDefaultFolder = folderInfo.permission === 'default';

  return (
    <div className="flex flex-col min-h-screen bg-white dark:bg-surface-950">
      {/* 헤더 */}
      <div className="sticky top-0 z-20 bg-white dark:bg-surface-950 border-b border-surface-100 dark:border-surface-800 px-4 h-14 flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2">
          <ChevronLeft className="size-6" />
        </button>
        <div className="flex-1 px-4 text-center overflow-hidden">
          <h1 className="text-lg font-black truncate">{folderInfo?.title || "맛탐정 폴더"}</h1>
        </div>
        <div className="flex items-center gap-1">
          <button className="p-2" onClick={() => {
            const url = `${window.location.origin}/folder/${id}`;
            navigator.clipboard.writeText(url);
            alert('링크가 복사되었습니다.');
          }}>
            <Share2 className="size-5" />
          </button>
          <div className="relative">
            <button className="p-2" onClick={() => setShowMenu(!showMenu)}>
              <MoreVertical className="size-5" />
            </button>
            {showMenu && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
                <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-surface-800 rounded-xl shadow-lg border border-surface-100 dark:border-surface-700 py-1 z-20">
                  {isOwner && folderInfo.permission === 'invite' && (
                    <button 
                      className="w-full px-4 py-3 text-left text-sm font-medium flex items-center gap-2 hover:bg-surface-50 dark:hover:bg-surface-700"
                      onClick={() => { setShowInviteHistory(true); setShowMenu(false); }}
                    >
                      <Key className="size-4" />
                      초대 코드 관리
                    </button>
                  )}
                  {isOwner && !isDefaultFolder && (
                    <button 
                      className="w-full px-4 py-3 text-left text-sm font-medium flex items-center gap-2 hover:bg-surface-50 dark:hover:bg-surface-700 text-red-500"
                      onClick={handleHideFolder}
                    >
                      <EyeOff className="size-4" />
                      폴더 숨기기
                    </button>
                  )}
                  {!isOwner && (
                    <div className="px-4 py-3 text-sm text-surface-400">
                      메뉴 없음
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* 폴더 정보 요약 */}
      <div className="px-5 py-6 flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-black text-surface-900 dark:text-white leading-tight">
              {folderInfo?.title}
            </h2>
            {folderInfo?.permission === 'public' ? (
              <Users className="size-5 text-surface-400" />
            ) : (
              <User className="size-5 text-surface-400" />
            )}
            {isDefaultFolder && (
              <span className="px-2 py-0.5 text-xs font-bold bg-surface-100 dark:bg-surface-800 rounded-full text-surface-500">
                기본
              </span>
            )}
          </div>
          {folderInfo?.description && (
            <p className="text-surface-500 font-medium leading-relaxed">
              {folderInfo.description}
            </p>
          )}
        </div>

        <div className="flex items-center gap-4 py-2">
          <div className="flex flex-col gap-0.5">
            <span className="text-xs text-surface-400 font-bold uppercase tracking-wider">PLACES</span>
            <span className="text-lg font-black text-surface-900 dark:text-white">{folderInfo?.place_count || 0}</span>
          </div>
          {folderInfo.permission !== 'default' && (
            <>
              <div className="w-px h-8 bg-surface-100 dark:bg-surface-800" />
              <div className="flex flex-col gap-0.5">
                <span className="text-xs text-surface-400 font-bold uppercase tracking-wider">SUBSCRIBERS</span>
                <span className="text-lg font-black text-surface-900 dark:text-white">{folderInfo?.subscriber_count || 0}</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* 초대 관리 섹션 (소유자 + 초대 폴더인 경우) */}
      {isOwner && folderInfo.permission === 'invite' && (
        <FolderInviteAdminSection 
          folderId={id!}
          inviteCode={folderInfo.invite_code}
          expiresAt={folderInfo.invite_code_expires_at}
          onOpenHistory={() => setShowInviteHistory(true)}
        />
      )}

      {/* 툴바 */}
      <div className="sticky top-14 z-10 bg-white dark:bg-surface-950 px-4 py-3 flex items-center justify-between border-b border-surface-50 dark:border-surface-900">
        <div className="flex bg-surface-100 dark:bg-surface-900 p-1 rounded-xl">
          <button 
            onClick={() => setViewMode('grid')}
            className={cn(
              "px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all",
              viewMode === 'grid' ? "bg-white dark:bg-surface-800 shadow-sm text-primary-500" : "text-surface-400"
            )}
          >
            <LayoutGrid className="size-4" />
            <span className="text-xs font-bold">목록</span>
          </button>
          <button 
            onClick={() => setViewMode('map')}
            className={cn(
              "px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all",
              viewMode === 'map' ? "bg-white dark:bg-surface-800 shadow-sm text-primary-500" : "text-surface-400"
            )}
          >
            <MapIcon className="size-4" />
            <span className="text-xs font-bold">지도</span>
          </button>
        </div>

        {canEdit && (
          <Button 
            size="sm" 
            className="rounded-xl font-bold gap-1.5"
            onClick={() => setIsSearchOpen(true)}
          >
            <Plus className="size-4" />
            장소 추가
          </Button>
        )}
      </div>

      {/* 목록 영역 */}
      <div className="flex-1 p-4">
        {places.length > 0 ? (
          folderInfo.permission === 'invite' ? (
            // invite 폴더: 리스트 뷰 + 비공개 리뷰
            <div className="flex flex-col gap-4">
              {places.map((item: any) => (
                <div key={item.place_id} className="flex flex-col gap-3 p-4 bg-white dark:bg-surface-900 rounded-2xl shadow-sm border border-surface-100 dark:border-surface-800">
                  <div className="flex gap-3" onClick={() => showPlaceModal(item.place_id)}>
                    <div className="size-20 rounded-xl overflow-hidden flex-shrink-0 bg-surface-100">
                      {item.place_data.image_urls?.[0] && (
                        <img 
                          src={item.place_data.image_urls[0]} 
                          alt={item.place_data.name}
                          className="size-full object-cover"
                        />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-surface-900 dark:text-white truncate">
                        {item.place_data.name}
                      </h3>
                      <p className="text-sm text-surface-500 truncate">{item.place_data.category}</p>
                      <p className="text-xs text-surface-400 mt-1">
                        {formatKoreanDate(item.added_at)} 추가됨
                      </p>
                    </div>
                  </div>
                  <FolderReviewSection 
                    folderId={id!}
                    placeId={item.place_id}
                    placeName={item.place_data.name}
                  />
                </div>
              ))}
            </div>
          ) : (
            // 일반 폴더: 그리드 뷰
            <div className="grid grid-cols-2 gap-4">
              {places.map((item: any) => (
                <div key={item.place_id} className="w-full">
                  <PlaceSliderCard 
                    placeId={item.place_id}
                    name={item.place_data.name}
                    thumbnail={item.place_data.image_urls?.[0]}
                    category={item.place_data.category}
                    onClick={showPlaceModal}
                    snap={false}
                  />
                </div>
              ))}
            </div>
          )
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
            <div className="p-6 rounded-full bg-surface-50 dark:bg-surface-900">
              <Info className="size-10 text-surface-200" />
            </div>
            <div>
              <p className="text-lg font-bold text-surface-900 dark:text-white">아직 등록된 장소가 없습니다</p>
              <p className="text-sm text-surface-500 mt-1">
                {isOwner ? "맛집을 검색해서 나만의 폴더를 채워보세요!" : "사용자가 아직 장소를 추가하지 않았습니다."}
              </p>
            </div>
            {isOwner && (
              <Button onClick={() => setIsSearchOpen(true)} variant="outline" className="mt-2 font-bold">
                첫 번째 장소 추가하기
              </Button>
            )}
          </div>
        )}

        {hasNextPage && (
          <div className="py-8 flex justify-center">
            <Loader2 className="size-6 text-surface-300 animate-spin" />
          </div>
        )}
      </div>

      <PlaceSearchModal 
        isOpen={isSearchOpen} 
        onClose={() => setIsSearchOpen(false)}
        onSelect={handleAddPlace}
      />

      {showInviteHistory && (
        <InviteHistoryModal 
          folderId={id!} 
          onClose={() => setShowInviteHistory(false)} 
        />
      )}
    </div>
  );
}
