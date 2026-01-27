import { useState, useMemo } from "react";
import { useNavigate } from "react-router";
import { Plus, User, ArrowRight, Sparkles } from "lucide-react";
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

export function HomePage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useUserStore();
  const { openLogin } = useAuthModalStore();
  const { show: showPlaceModal } = usePlacePopup();

  const [activeTab, setActiveTab] = useState<"foryou" | "following">("foryou");

  // Data Fetching
  const { data: subscriptions, isLoading: isSubscriptionsLoading } = useMySubscriptions();
  const { data: discoverData, isLoading: isDiscoverLoading } = useHomeDiscover();
  const { data: publicFoldersData, isLoading: isPublicFoldersLoading } = usePublicFolders();

  const publicFolders = publicFoldersData?.pages?.flatMap(page => page) || [];

  const handleCreateFolder = () => {
    if (!isAuthenticated) {
      openLogin();
      return;
    }
    navigate("/folder/create");
  };

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
        {/* Stories */}
        <StoriesSection isLoading={isDiscoverLoading}>
          {/* 사용자 데이터
            - 최근에 음식점을 등록한 순서대로 나온다. 이 정보는 5분마다 집계된 정보로 캐싱된 데이터를 사용한다.
           */}
          {discoverData?.users?.map((user: any, i: number) => (
            <StoryBox
              key={`user-${user.id || i}`}
              image={user.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.id || i + 100}`}
              label={user.nickname || '사용자'}
              onClick={() => navigate(`/profile/${user.id}`)}
            />
          ))}
          {/* 유튜브 채널 데이터 */}
          {/* {discoverData?.youtubeChannels?.map((channel: any, i: number) => (
            <StoryBox
              key={`youtube-${channel.channel_id || i}`}
              image={channel.channel_thumbnail || `https://api.dicebear.com/7.x/avataaars/svg?seed=${channel.channel_id || i + 200}`}
              label={channel.channel_title || '유튜브'}
              onClick={() => navigate(`/feature/detail/youtube/${channel.channel_id}`)}
              badge="youtube"
            />
          ))} */}
        </StoriesSection>

        {/* Main Content */}
        {activeTab === "foryou" ? (
          <ForYouContent
            discoverData={discoverData}
            publicFolders={publicFolders}
            isLoading={isDiscoverLoading || isPublicFoldersLoading}
            onPlaceClick={showPlaceModal}
          />
        ) : (
          <FollowingContent
            subscriptions={subscriptions || []}
            isLoading={isSubscriptionsLoading}
            onPlaceClick={showPlaceModal}
          />
        )}
      </main>
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
}: {
  discoverData: any;
  publicFolders: any[];
  isLoading: boolean;
  onPlaceClick: (id: string) => void;
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
      <div className="px-4 mt-6 mb-4">
        <h2 className="text-base font-bold text-surface-900 dark:text-white">추천</h2>
      </div>
      <HeroSection publicFolders={publicFolders} />
      {/* 인기 음식점 섹션 */}
      <PopularPlacesSection
        places={discoverData?.popularPlaces}
        onPlaceClick={onPlaceClick}
      />
      {/* 발견하기 섹션 */}
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
        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-rose-100 to-amber-100 dark:from-surface-800 dark:to-surface-700 flex items-center justify-center mb-6">
          <Sparkles className="size-10 text-rose-300" />
        </div>
        <h3 className="text-xl font-bold text-surface-900 dark:text-white mb-2">구독을 시작해보세요</h3>
        <p className="text-sm text-surface-500 mb-8 leading-relaxed">마음에 드는 맛집 폴더를 구독하고<br/>새로운 맛집 소식을 받아보세요</p>
        <button
          onClick={() => navigate("/feature")}
          className="px-8 py-3.5 bg-surface-900 dark:bg-white text-white dark:text-surface-900 rounded-full font-semibold text-sm flex items-center gap-2"
        >
          탐색하기 <ArrowRight className="size-4" />
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
