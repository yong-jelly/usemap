import { useNavigate } from "react-router";
import { useState } from "react";
import { useMySubscriptions, useToggleFolderSubscription, useToggleFeatureSubscription } from "@/entities/folder/queries";
import { Button } from "@/shared/ui";
import { Loader2, ExternalLink, User, Bell } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import naverIcon from "@/assets/images/naver-map-logo.png";

export function SubscriptionList() {
  const navigate = useNavigate();
  const [cooldowns, setCooldowns] = useState<Record<string, boolean>>({});
  const { data: subscriptions, isLoading } = useMySubscriptions();
  const { mutate: toggleFolder, isPending: isFolderPending, variables: folderIdBeingToggled } = useToggleFolderSubscription();
  const { mutate: toggleFeature, isPending: isFeaturePending, variables: featureBeingToggled } = useToggleFeatureSubscription();

  const handleUnsubscribe = (sub: any) => {
    const id = `${sub.subscription_type}-${sub.feature_id}`;
    if (cooldowns[id]) return;

    // 1초간 클릭 방지 및 음영 처리를 위한 쿨다운 설정
    setCooldowns(prev => ({ ...prev, [id]: true }));
    setTimeout(() => {
      setCooldowns(prev => ({ ...prev, [id]: false }));
    }, 1000);

    if (sub.subscription_type === 'folder') {
      toggleFolder(sub.feature_id);
    } else {
      toggleFeature({ type: sub.subscription_type, id: sub.feature_id });
    }
  };

  const handleNavigate = (sub: any) => {
    switch (sub.subscription_type) {
      case 'folder':
        navigate(`/folder/${sub.feature_id}`);
        break;
      case 'naver_folder':
        navigate(`/feature/detail/folder/${sub.feature_id}`);
        break;
      case 'youtube_channel':
        navigate(`/feature/detail/youtube/${sub.feature_id}`);
        break;
      case 'community_region':
        navigate(`/feature/detail/community/${sub.feature_id}`);
        break;
      case 'region_recommend':
        navigate(`/feature/detail/region/${sub.feature_id}`);
        break;
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center p-12">
        <Loader2 className="size-8 text-surface-300 animate-spin" />
      </div>
    );
  }

  const regionRecommendations = subscriptions?.filter((sub: any) => sub.subscription_type === 'region_recommend') || [];
  const otherSubscriptions = subscriptions?.filter((sub: any) => sub.subscription_type !== 'region_recommend') || [];

  const renderSubscriptionItem = (sub: any) => {
    const itemId = `${sub.subscription_type}-${sub.feature_id}`;
    const isCooldown = cooldowns[itemId];
    const isToggling = 
      (sub.subscription_type === 'folder' && isFolderPending && folderIdBeingToggled === sub.feature_id) ||
      (sub.subscription_type !== 'folder' && isFeaturePending && featureBeingToggled?.id === sub.feature_id && featureBeingToggled?.type === sub.subscription_type);

    // 낙관적 업데이트가 적용되었으므로 sub.is_subscribed를 그대로 사용
    const displaySubscribed = sub.is_subscribed !== false;
    const displayThumbnail = sub.subscription_type === 'naver_folder' ? naverIcon : sub.thumbnail;

    return (
      <div key={itemId} className="flex items-center gap-4 p-4 hover:bg-surface-50 dark:hover:bg-surface-900/50 transition-colors">
        {/* 썸네일/아이콘 */}
        <div className="size-12 rounded-full bg-surface-100 dark:bg-surface-800 flex-shrink-0 overflow-hidden border border-surface-100 dark:border-surface-800">
          {displayThumbnail ? (
            <img src={displayThumbnail} alt={sub.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-surface-300">
              <User className="size-5" />
            </div>
          )}
        </div>

        {/* 정보 */}
        <div className="flex-1 min-w-0 cursor-pointer" onClick={() => handleNavigate(sub)}>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-primary-500 uppercase">
              {sub.subscription_type === 'folder' ? '맛탐정' : 
               sub.subscription_type === 'naver_folder' ? '플레이스' :
               sub.subscription_type === 'youtube_channel' ? '유튜브' : 
               sub.subscription_type === 'region_recommend' ? '지역추천' : '커뮤니티'}
            </span>
          </div>
          <h4 className="font-medium text-[15px] text-surface-900 dark:text-white truncate">{sub.title}</h4>
          {sub.description && (
            <p className="text-xs text-surface-500 truncate mt-0.5">{sub.description}</p>
          )}
        </div>

        {/* 액션 */}
        <div className="flex items-center gap-1">
          <Button 
            variant="outline"
            size="sm"
            disabled={isCooldown || isToggling}
            onClick={(e) => {
              e.stopPropagation();
              handleUnsubscribe(sub);
            }}
            className={cn(
              "rounded-full h-8 font-medium transition-colors px-3",
              displaySubscribed 
                ? "bg-primary-50 border-primary-200 text-primary-600 dark:bg-primary-900/20 dark:border-primary-800" 
                : "border-surface-200 dark:border-surface-700 text-surface-400",
              (isCooldown || isToggling) && "opacity-50 grayscale"
            )}
          >
            <span className="text-xs">{displaySubscribed ? "구독중" : "구독"}</span>
          </Button>
          <button 
            onClick={(e) => {
              e.stopPropagation();
              handleNavigate(sub);
            }}
            className="p-2 text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-800 rounded-full transition-colors"
          >
            <ExternalLink className="size-4" />
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-8 py-4">
      {/* 지역 추천 섹션 (있는 경우에만 표시) */}
      {regionRecommendations.length > 0 && (
        <div className="flex flex-col gap-4">
          <div className="px-5">
            <h2 className="text-xl font-medium text-surface-900 dark:text-white">지역 추천</h2>
            <p className="text-sm text-surface-500">구독 중인 지역별 맛집 소식입니다.</p>
          </div>
          <div className="flex flex-col divide-y divide-surface-50 dark:divide-surface-900 border-t border-surface-50 dark:border-surface-900">
            {regionRecommendations.map(renderSubscriptionItem)}
          </div>
        </div>
      )}

      {/* 구독 섹션 */}
      <div className="flex flex-col gap-4">
        <div className="px-5">
          <h2 className="text-xl font-medium text-surface-900 dark:text-white">내가 구독중인 맛탐정</h2>
          <p className="text-sm text-surface-500">관심 있는 채널이나 폴더에서 업데이트를 받아보고 있습니다.</p>
        </div>

        {otherSubscriptions.length > 0 ? (
          <div className="flex flex-col divide-y divide-surface-50 dark:divide-surface-900 border-t border-surface-50 dark:border-surface-900">
            {otherSubscriptions.map(renderSubscriptionItem)}
          </div>
        ) : regionRecommendations.length === 0 ? (
          <div className="mx-5 p-10 rounded-xl bg-surface-50 dark:bg-surface-800/50 border border-dashed border-surface-200 dark:border-surface-700 flex flex-col items-center gap-3 text-center">
            <Bell className="size-10 text-surface-300" />
            <div>
              <p className="text-sm text-surface-600 dark:text-surface-300">구독 중인 폴더가 없습니다</p>
              <p className="text-xs text-surface-400 mt-1">트렌드 탭에서 마음에 드는 폴더를 구독해보세요!</p>
            </div>
            <Button onClick={() => navigate("/feature")} variant="outline" size="sm" className="rounded-full px-5">
              구독하러 가기
            </Button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
