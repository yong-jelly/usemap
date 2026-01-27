import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router";
import { useMySubscriptions, usePublicFolders } from "@/entities/folder/queries";
import { useHomeDiscover } from "@/entities/home/queries";
import { cn } from "@/shared/lib/utils";
import { useUserStore } from "@/entities/user";
import { useAuthModalStore } from "@/features/auth/model/useAuthModalStore";
import { usePlacePopup } from "@/shared/lib/place-popup";

import { StoriesSection, StoryBox } from "@/widgets/StoriesSection";
import { HeroSection } from "@/widgets/HeroSection";
import { PopularPlacesSection } from "@/widgets/PopularPlacesSection";
import { DiscoverGrid, GridSkeleton, CollectionCard } from "@/widgets/DiscoverGrid";

import { PageHeader } from "@/shared/ui/PageHeader";
import { LocationSettingSheet } from "@/features/location/ui/LocationSettingSheet";
import { useUserLocations } from "@/entities/location";

export function HomePage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useUserStore();
  const { openLogin } = useAuthModalStore();
  const { show: showPlaceModal } = usePlacePopup();

  const [activeTab, setActiveTab] = useState<"foryou" | "following">("foryou");
  const [isLocationSheetOpen, setIsLocationSheetOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number; id: string } | null>(null);

  // Data Fetching
  const { data: subscriptions, isLoading: isSubscriptionsLoading } = useMySubscriptions();
  const { data: discoverData, isLoading: isDiscoverLoading } = useHomeDiscover();
  const { data: publicFoldersData, isLoading: isPublicFoldersLoading } = usePublicFolders();
  const { data: userLocations } = useUserLocations({ limit: 1 }, { enabled: isAuthenticated });

  const publicFolders = publicFoldersData?.pages?.flatMap(page => page) || [];

  // 최근 위치 정보 초기화
  useEffect(() => {
    if (userLocations && userLocations.length > 0 && !selectedLocation) {
      setSelectedLocation({
        lat: userLocations[0].latitude,
        lng: userLocations[0].longitude,
        id: userLocations[0].id
      });
    }
  }, [userLocations, selectedLocation]);

  const tabs = [
    { id: "foryou", label: "추천" },
    { id: "following", label: "팔로잉" },
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-surface-950">
      {/* Header */}
      <PageHeader 
        tabs={tabs} 
        activeTab={activeTab} 
        onTabChange={(id) => setActiveTab(id as "foryou" | "following")} 
      />

      <main className="pt-24">
        {/* 대시보드 상단: 위치 및 상태 브리핑 */}
        <section className="px-4 mb-8">
          <div 
            onClick={() => setIsLocationSheetOpen(true)}
            className="flex items-center justify-between p-5 rounded-2xl bg-surface-50 dark:bg-surface-900 border border-surface-100 dark:border-surface-800 cursor-pointer transition-all"
          >
            <div className="flex flex-col gap-1">
              <span className="text-[10px] text-primary-600 font-medium uppercase tracking-wider">Current Location</span>
              <h3 className="text-base font-medium text-surface-900 dark:text-white">
                {selectedLocation ? `${userLocations?.[0]?.nearest_place_name || '현재 위치'} 주변` : '위치 설정'}
              </h3>
              <p className="text-[11px] text-surface-500">
                {selectedLocation ? '주변 맛집의 기록을 확인해보세요' : '거리순 정렬과 주변 탐색이 가능해집니다'}
              </p>
            </div>
            <span className="text-xs text-surface-400 font-medium">변경</span>
          </div>
        </section>

        {/* Stories: 맛탐정(유저) 및 소스 브리핑 */}
        <div className="px-4 mb-2 flex items-center justify-between">
          <h2 className="text-xs text-surface-500 font-medium uppercase tracking-wider">
            Active Detectives
          </h2>
        </div>
        <StoriesSection isLoading={isDiscoverLoading}>
          {discoverData?.users?.map((user: any, i: number) => (
            <StoryBox
              key={`user-${user.id || i}`}
              image={user.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.id || i + 100}`}
              label={user.nickname || '사용자'}
              onClick={() => navigate(`/profile/${user.id}`)}
            />
          ))}
        </StoriesSection>

        {/* Main Content */}
        {activeTab === "foryou" ? (
          <ForYouContent
            discoverData={discoverData}
            publicFolders={publicFolders}
            isLoading={isDiscoverLoading || isPublicFoldersLoading}
            onPlaceClick={showPlaceModal}
            selectedLocation={selectedLocation}
          />
        ) : (
          <FollowingContent
            subscriptions={subscriptions || []}
            isLoading={isSubscriptionsLoading}
            onPlaceClick={showPlaceModal}
          />
        )}
      </main>

      {/* 위치 설정 바텀 시트 */}
      <LocationSettingSheet 
        isOpen={isLocationSheetOpen}
        onClose={() => setIsLocationSheetOpen(false)}
        onSelect={(lat, lng, id) => {
          setSelectedLocation({ lat, lng, id });
          setIsLocationSheetOpen(false);
        }}
        selectedId={selectedLocation?.id}
      />
    </div>
  );
}

/**
 * For You 탭 콘텐츠
 */
function ForYouContent({
  discoverData,
  publicFolders,
  isLoading,
  onPlaceClick,
  selectedLocation,
}: {
  discoverData: any;
  publicFolders: any[];
  isLoading: boolean;
  onPlaceClick: (id: string) => void;
  selectedLocation: any;
}) {
  const mixedContent = useMemo(() => {
    if (isLoading || !publicFolders) return [];
    const items: any[] = [];
    publicFolders?.forEach((folder, i) => {
      items.push({ type: 'folder', data: folder, size: i % 5 === 0 ? 'large' : 'normal' });
    });
    discoverData?.popularPlaces?.forEach((place: any, i: number) => {
      items.push({ type: 'place', data: place, size: i % 4 === 0 ? 'large' : 'normal' });
    });
    discoverData?.youtubeChannels?.forEach((channel: any, i: number) => {
      items.push({ type: 'youtube', data: channel, size: i % 3 === 0 ? 'large' : 'normal' });
    });
    discoverData?.naverFolders?.forEach((folder: any, i: number) => {
      items.push({ type: 'naver', data: folder, size: i % 4 === 0 ? 'large' : 'normal' });
    });
    return items.sort((a, b) => {
      const aKey = `${a.type}-${a.data.id || a.data.folder_id || a.data.channel_id}`;
      const bKey = `${b.type}-${b.data.id || b.data.folder_id || b.data.channel_id}`;
      return aKey.localeCompare(bKey);
    });
  }, [publicFolders, discoverData, isLoading]);

  if (isLoading) {
    return <div className="px-4 pb-32"><GridSkeleton /></div>;
  }

  return (
    <div className="pb-32">
      {/* 아카이브 큐레이션 섹션 */}
      <div className="px-4 mt-10 mb-4 flex items-center justify-between">
        <h2 className="text-base font-medium text-surface-900 dark:text-white">추천 아카이브</h2>
        {selectedLocation && (
          <span className="text-[10px] text-primary-600 font-medium uppercase tracking-tight">
            Nearby First
          </span>
        )}
      </div>
      
      <HeroSection publicFolders={publicFolders} />
      
      {/* 인기 음식점 섹션: 맥락 강조 */}
      <div className="px-4 mt-12 mb-4">
        <h2 className="text-base font-medium text-surface-900 dark:text-white">
          많이 저장된 장소
        </h2>
      </div>
      <PopularPlacesSection
        places={discoverData?.popularPlaces}
        onPlaceClick={onPlaceClick}
      />
      
      {/* 발견하기 섹션: 다양한 소스 탐색 */}
      <div className="px-4 mt-12 mb-4">
        <h2 className="text-base font-medium text-surface-900 dark:text-white">
          새로운 기록 발견
        </h2>
      </div>
      <DiscoverGrid items={mixedContent.slice(1)} onPlaceClick={onPlaceClick} />
    </div>
  );
}

/**
 * Following 탭 콘텐츠
 */
function FollowingContent({
  subscriptions,
  isLoading,
  onPlaceClick,
}: {
  subscriptions: any[];
  isLoading: boolean;
  onPlaceClick: (id: string) => void;
}) {
  const navigate = useNavigate();

  if (isLoading) {
    return <div className="px-4 pb-32"><GridSkeleton /></div>;
  }

  if (!subscriptions || subscriptions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 px-8 text-center">
        <div className="w-24 h-24 rounded-full bg-surface-50 dark:bg-surface-900 flex items-center justify-center mb-6">
          <span className="text-2xl font-medium text-primary-500">!</span>
        </div>
        <h3 className="text-xl font-medium text-surface-900 dark:text-white mb-2">구독을 시작해보세요</h3>
        <p className="text-sm text-surface-500 mb-8 leading-relaxed">마음에 드는 맛집 폴더를 구독하고<br/>새로운 맛집 소식을 받아보세요</p>
        <button
          onClick={() => navigate("/feature")}
          className="px-8 py-3.5 bg-surface-900 dark:bg-white text-white dark:text-surface-900 rounded-full font-medium text-sm"
        >
          탐색하기
        </button>
      </div>
    );
  }

  return (
    <div className="px-4 pb-32">
      <div className="columns-2 gap-3">
        {subscriptions.map((sub: any, index: number) => (
          <CollectionCard
            key={`${sub.subscription_type}-${sub.feature_id}`}
            item={{
              type: sub.subscription_type === 'youtube_channel' ? 'youtube' : sub.subscription_type === 'naver_folder' ? 'naver' : 'folder',
              data: sub,
              size: index % 4 === 0 ? 'large' : 'normal',
            }}
            index={index}
            onPlaceClick={onPlaceClick}
            onClick={() => {
              if (sub.subscription_type === 'folder') navigate(`/folder/${sub.feature_id}`);
              else if (sub.subscription_type === 'naver_folder') navigate(`/feature/detail/folder/${sub.feature_id}`);
              else if (sub.subscription_type === 'youtube_channel') navigate(`/feature/detail/youtube/${sub.feature_id}`);
              else if (sub.subscription_type === 'place') onPlaceClick(sub.feature_id);
            }}
          />
        ))}
      </div>
    </div>
  );
}
