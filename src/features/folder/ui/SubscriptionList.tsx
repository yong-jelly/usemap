import { useNavigate } from "react-router";
import { useState } from "react";
import { useMySubscriptions, useToggleFolderSubscription, useToggleFeatureSubscription } from "@/entities/folder/queries";
import { Button } from "@/shared/ui";
import { Loader2, ExternalLink, Bell, ChevronRight } from "lucide-react";
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

    // 미리보기 이미지 스택 (애플 스타일)
    const previewImages = sub.preview_places?.slice(0, 3).map((p: any) => 
      p.image_urls?.[0] || p.images?.[0] || p.thumbnail
    ).filter(Boolean) || [];

    return (
      <div 
        key={itemId} 
        className="w-full flex items-center gap-4 p-3 rounded-2xl transition-all text-left cursor-pointer group hover:bg-surface-50 dark:hover:bg-surface-900"
        onClick={() => handleNavigate(sub)}
      >
        {/* 썸네일/이미지 스택 */}
        <div className="relative shrink-0">
          {previewImages.length > 0 ? (
            <div className="size-14 relative">
              {previewImages.slice(0, 3).map((img: string, idx: number) => (
                <div
                  key={idx}
                  className={cn(
                    "absolute inset-0 rounded-xl overflow-hidden border border-white dark:border-surface-900 shadow-sm transition-transform duration-300",
                    idx === 0 && "z-30 scale-100",
                    idx === 1 && "z-20 translate-x-1.5 -translate-y-1 scale-[0.95] opacity-80 group-hover:translate-x-3 group-hover:-translate-y-2",
                    idx === 2 && "z-10 translate-x-3 -translate-y-2 scale-[0.9] opacity-60 group-hover:translate-x-6 group-hover:-translate-y-4"
                  )}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" loading="lazy" />
                </div>
              ))}
            </div>
          ) : (
            <div className="size-14 rounded-2xl bg-surface-100 dark:bg-surface-800 flex items-center justify-center overflow-hidden">
              {displayThumbnail ? (
                <img src={displayThumbnail} alt={sub.title} className="w-full h-full object-cover" />
              ) : (
                <Bell className="size-6 text-surface-300 stroke-[1.5]" />
              )}
            </div>
          )}
        </div>

        {/* 정보 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className="text-[10px] font-medium text-primary-500 uppercase tracking-wider">
              {sub.subscription_type === 'folder' ? '맛탐정' : 
               sub.subscription_type === 'naver_folder' ? '플레이스' :
               sub.subscription_type === 'youtube_channel' ? '유튜브' : 
               sub.subscription_type === 'region_recommend' ? '지역추천' : '커뮤니티'}
            </span>
          </div>
          <h4 className="text-[15px] font-medium text-surface-900 dark:text-white truncate tracking-tight">{sub.title}</h4>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="text-[12px] text-surface-400 font-normal truncate">
              {sub.description || (sub.place_count ? `장소 ${sub.place_count}개` : '업데이트 소식')}
            </span>
          </div>
        </div>

        {/* 액션 */}
        <div className="flex items-center gap-1 shrink-0">
          <Button 
            variant="outline"
            size="sm"
            disabled={isCooldown || isToggling}
            onClick={(e) => {
              e.stopPropagation();
              handleUnsubscribe(sub);
            }}
            className={cn(
              "rounded-full h-7 font-medium transition-all px-3 border-none",
              displaySubscribed 
                ? "bg-primary-50 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400" 
                : "bg-surface-100 text-surface-400 dark:bg-surface-800",
              (isCooldown || isToggling) && "opacity-50 grayscale"
            )}
          >
            <span className="text-[11px]">{displaySubscribed ? "구독중" : "구독"}</span>
          </Button>
          <ChevronRight className="size-4 text-surface-200 group-hover:text-surface-400 transition-colors" />
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-8 py-4">
      {/* 지역 추천 섹션 (있는 경우에만 표시) */}
      {regionRecommendations.length > 0 && (
        <div className="flex flex-col gap-2">
          <div className="px-5 mb-2">
            <h2 className="text-[17px] font-medium text-surface-900 dark:text-white tracking-tight">지역 추천</h2>
            <p className="text-[13px] text-surface-400 font-normal">구독 중인 지역별 맛집 소식</p>
          </div>
          <div className="px-2 flex flex-col">
            {regionRecommendations.map(renderSubscriptionItem)}
          </div>
        </div>
      )}

      {/* 구독 섹션 */}
      <div className="flex flex-col gap-2">
        <div className="px-5 mb-2">
          <h2 className="text-[17px] font-medium text-surface-900 dark:text-white tracking-tight">내가 구독중인 맛탐정</h2>
          <p className="text-[13px] text-surface-400 font-normal">관심 있는 채널 및 폴더 업데이트</p>
        </div>

        {otherSubscriptions.length > 0 ? (
          <div className="px-2 flex flex-col">
            {otherSubscriptions.map(renderSubscriptionItem)}
          </div>
        ) : regionRecommendations.length === 0 ? (
          <div className="mx-4 p-12 rounded-2xl bg-surface-50 dark:bg-surface-800/50 border border-dashed border-surface-200 dark:border-surface-700 flex flex-col items-center gap-4 text-center">
            <Bell className="size-12 text-surface-200" />
            <div>
              <p className="text-sm text-surface-900 dark:text-white">구독 중인 폴더가 없습니다</p>
              <p className="text-xs text-surface-500 mt-1">트렌드 탭에서 마음에 드는 폴더를 구독해보세요!</p>
            </div>
            <Button onClick={() => navigate("/feature")} variant="outline" size="sm" className="mt-2 rounded-full px-6">
              구독하러 가기
            </Button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
