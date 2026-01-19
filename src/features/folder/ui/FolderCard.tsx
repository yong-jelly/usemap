import { useNavigate } from "react-router";
import { Folder } from "@/entities/folder/types";
import { PlaceSlider, Button } from "@/shared/ui";
import { usePlacePopup } from "@/shared/lib/place-popup";
import { User, Users, Heart, Lock, Globe, EyeOff, Clock } from "lucide-react";
import { useToggleFolderSubscription, useMySubscriptions } from "@/entities/folder/queries";
import { useUserStore } from "@/entities/user";
import { useAuthModalStore } from "@/features/auth/model/useAuthModalStore";
import { cn } from "@/shared/lib/utils";
import { ago, safeFormatDate } from "@/shared/lib/date";
import React from "react";

interface FolderCardProps {
  folder: Folder;
  hideSubscribeButton?: boolean;
  showOwner?: boolean;
}

export function FolderCard({ 
  folder, 
  hideSubscribeButton = false,
  showOwner = false 
}: FolderCardProps) {
  const navigate = useNavigate();
  const { show: showPlaceModal } = usePlacePopup();
  const { isAuthenticated, user } = useUserStore();
  const { openLogin } = useAuthModalStore();
  
  const { data: mySubscriptions } = useMySubscriptions();
  const { 
    mutate: toggleSubscription, 
    isPending: isTogglePending, 
    variables: toggledFolderId 
  } = useToggleFolderSubscription();

  const isOwner = folder.owner_id === user?.id;
  const isSubscribed = mySubscriptions?.some(
    (sub: any) => sub.subscription_type === 'folder' && sub.feature_id === folder.id && sub.is_subscribed !== false
  );

  // 낙관적 업데이트를 위한 UI 상태 계산
  const isCurrentlyToggling = isTogglePending && toggledFolderId === folder.id;
  const displaySubscribed = isCurrentlyToggling ? !isSubscribed : isSubscribed;

  const handleSubscribe = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isAuthenticated) {
      openLogin();
      return;
    }
    toggleSubscription(folder.id);
  };

  const statusInfo = React.useMemo(() => {
    if (!isOwner) return null;
    
    switch (folder.permission) {
      case 'public':
        return { icon: Globe, text: '공개', className: 'text-blue-500 bg-blue-50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-800' };
      case 'private':
        return { icon: Lock, text: '비공개', className: 'text-surface-400 bg-surface-50 dark:bg-surface-800 border-surface-100 dark:border-surface-700' };
      case 'hidden':
        return { icon: EyeOff, text: '링크 공개', className: 'text-amber-600 bg-amber-50 dark:bg-amber-900/20 border-amber-100 dark:border-amber-800' };
      case 'invite':
        return { icon: Users, text: '초대 전용', className: 'text-purple-600 bg-purple-50 dark:bg-purple-900/20 border-purple-100 dark:border-purple-800' };
      default:
        return null;
    }
  }, [isOwner, folder.permission]);

  const updateDateLabel = React.useMemo(() => {
    const displayDate = folder.updated_at || folder.created_at;
    const date = new Date(displayDate);
    const now = new Date();
    const diffDays = (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24);
    
    if (diffDays > 7) {
      return safeFormatDate(displayDate, { year: '2-digit', month: 'numeric', day: 'numeric' });
    }
    return ago(displayDate);
  }, [folder.updated_at, folder.created_at]);

  return (
    <section className="flex flex-col gap-3 px-4 py-2">
      {/* 제목 영역: 프로필 + 타이틀 + 개수 */}
      <div className="flex items-center gap-2.5 overflow-hidden">
        {showOwner && (
          <div 
            className="w-10 h-10 rounded-full bg-surface-200 overflow-hidden flex-shrink-0 border border-surface-100 dark:border-surface-800 cursor-pointer"
            onClick={() => navigate(`/folder/${folder.id}`)}
          >
            {folder.owner_avatar_url ? (
              <img 
                src={folder.owner_avatar_url} 
                alt={folder.owner_nickname} 
                className="w-full h-full object-cover" 
                loading="lazy"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-surface-100 dark:bg-surface-800">
                <User className="size-5 text-surface-400" />
              </div>
            )}
          </div>
        )}
        
        <div className="flex items-start justify-between flex-1 gap-2 overflow-hidden">
          <div className="flex flex-col gap-0.5 overflow-hidden">
            <div className="flex items-center gap-1.5 overflow-hidden">
              <h3 
                className="text-lg font-medium text-surface-900 dark:text-white leading-tight truncate cursor-pointer hover:underline underline-offset-4"
                onClick={() => navigate(`/folder/${folder.id}`)}
              >
                {folder.title}
              </h3>
              {isOwner && statusInfo && (
                <div className={cn(
                  "flex items-center gap-0.5 px-1.5 py-0.5 rounded-full border flex-shrink-0",
                  statusInfo.className
                )}>
                  <statusInfo.icon className="size-2.5" />
                  <span className="text-[10px] font-medium leading-none">{statusInfo.text}</span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              {showOwner && (
                <>
                  <span className="text-xs font-medium text-surface-400">
                    {folder.owner_nickname || '익명'}
                  </span>
                  <span className="text-[10px] text-surface-300">•</span>
                </>
              )}
              <span className="text-xs font-medium text-surface-400">
                {folder.place_count.toLocaleString()}개 매장
              </span>
              <span className="text-[10px] text-surface-300">•</span>
              <span className="text-[11px] text-surface-400 flex items-center gap-1">
                <Clock className="size-3" />
                {updateDateLabel}
              </span>
            </div>
          </div>

          {!isOwner && !hideSubscribeButton && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleSubscribe}
              disabled={isCurrentlyToggling}
              className={cn(
                "flex-shrink-0 rounded-full h-8 gap-1.5 font-medium transition-colors duration-150 px-3",
                displaySubscribed 
                  ? "bg-primary-50 border-primary-200 text-primary-600 dark:bg-primary-900/20 dark:border-primary-800" 
                  : "border-surface-200 dark:border-surface-700"
              )}
            >
              <Heart className={cn("size-3.5", displaySubscribed && "fill-primary-500 text-primary-500")} />
              <span className="text-xs">{displaySubscribed ? "구독중" : "구독"}</span>
            </Button>
          )}
        </div>
      </div>

      {folder.description && (
        <p className="text-sm text-surface-500 line-clamp-1 px-0.5">
          {folder.description}
        </p>
      )}

      {/* 장소 슬라이더 */}
      <div className="-mx-4">
        <PlaceSlider
          title=""
          items={folder.preview_places?.map((p: any) => ({
            ...p,
            thumbnail: p.thumbnail || p.images?.[0] || p.image_urls?.[0] || p.place_images?.[0]
          })) || []}
          onItemClick={showPlaceModal}
          onMoreClick={() => navigate(`/folder/${folder.id}`)}
          showMoreThreshold={5}
          showRating={false}
          snap={false}
        />
      </div>
    </section>
  );
}
