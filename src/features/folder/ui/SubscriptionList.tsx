import { useNavigate } from "react-router";
import { useMySubscriptions, useToggleFolderSubscription, useToggleFeatureSubscription } from "@/entities/folder/queries";
import { Button } from "@/shared/ui";
import { Loader2, Heart, ExternalLink } from "lucide-react";
import { cn } from "@/shared/lib/utils";

export function SubscriptionList() {
  const navigate = useNavigate();
  const { data: subscriptions, isLoading } = useMySubscriptions();
  const { mutate: toggleFolder } = useToggleFolderSubscription();
  const { mutate: toggleFeature } = useToggleFeatureSubscription();

  const handleUnsubscribe = (sub: any) => {
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
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center p-12">
        <Loader2 className="size-8 text-surface-300 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col py-2">
      {subscriptions && subscriptions.length > 0 ? (
        <div className="flex flex-col divide-y divide-surface-50 dark:divide-surface-900">
          {subscriptions.map((sub: any) => (
            <div key={`${sub.subscription_type}-${sub.feature_id}`} className="flex items-center gap-4 p-4 hover:bg-surface-50 dark:hover:bg-surface-900/50 transition-colors">
              {/* 썸네일/아이콘 */}
              <div className="size-12 rounded-full bg-surface-100 dark:bg-surface-800 flex-shrink-0 overflow-hidden border border-surface-100 dark:border-surface-800">
                {sub.thumbnail ? (
                  <img src={sub.thumbnail} alt={sub.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-surface-300">
                    <Heart className="size-5" />
                  </div>
                )}
              </div>

              {/* 정보 */}
              <div className="flex-1 min-w-0" onClick={() => handleNavigate(sub)}>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-bold text-primary-500 uppercase">
                    {sub.subscription_type === 'folder' ? '맛탐정' : 
                     sub.subscription_type === 'naver_folder' ? '네이버' :
                     sub.subscription_type === 'youtube_channel' ? '유튜브' : '지역'}
                  </span>
                </div>
                <h4 className="font-bold text-surface-900 dark:text-white truncate">{sub.title}</h4>
                {sub.description && (
                  <p className="text-xs text-surface-500 truncate mt-0.5">{sub.description}</p>
                )}
              </div>

              {/* 액션 */}
              <div className="flex items-center gap-1">
                <button 
                  onClick={() => handleUnsubscribe(sub)}
                  className="p-2 text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-full transition-colors"
                >
                  <Heart className="size-5 fill-current" />
                </button>
                <button 
                  onClick={() => handleNavigate(sub)}
                  className="p-2 text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-800 rounded-full transition-colors"
                >
                  <ExternalLink className="size-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-20 text-center flex flex-col items-center gap-4">
          <Heart className="size-12 text-surface-100" />
          <div>
            <p className="text-lg font-bold text-surface-900 dark:text-white">구독 중인 폴더가 없습니다</p>
            <p className="text-sm text-surface-500 mt-1">트렌드 탭에서 마음에 드는 폴더를 구독해보세요!</p>
          </div>
          <Button onClick={() => navigate("/feature")} variant="outline" size="sm" className="mt-2 font-bold">
            구독하러 가기
          </Button>
        </div>
      )}
    </div>
  );
}
