import { useState } from "react";
import { useNaverFolders, useYoutubeChannels, useCommunityContents } from "@/entities/place/queries";
import { cn } from "@/shared/lib/utils";
import { usePlacePopup } from "@/shared/lib/place-popup";
import { Plus } from "lucide-react";
import { Button, PlaceSlider } from "@/shared/ui";

/**
 * 피쳐 페이지 컴포넌트
 */
export function FeaturePage() {
  const [activeTab, setActiveTab] = useState("folder");

  const tabs = [
    { id: "folder", label: "플레이스" },
    { id: "youtube", label: "유튜브" },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-white dark:bg-surface-950 pb-20">
      {/* 상단 헤더 - 타이포 중심 */}
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md dark:bg-surface-950/80 px-5 pt-8 pb-4">
        <div className="flex items-center gap-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "text-2xl font-black transition-colors relative",
                activeTab === tab.id 
                  ? "text-surface-900 dark:text-white" 
                  : "text-surface-300 dark:text-surface-700"
              )}
            >
              {tab.label}
              {activeTab === tab.id && (
                <div className="absolute -bottom-2 left-0 right-0 h-1 bg-surface-900 dark:bg-white rounded-full" />
              )}
            </button>
          ))}
          <button
            onClick={() => setActiveTab("community")}
            className={cn(
              "text-2xl font-black transition-colors relative",
              activeTab === "community" 
                ? "text-surface-900 dark:text-white" 
                : "text-surface-300 dark:text-surface-700"
            )}
          >
            커뮤니티
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {activeTab === "folder" && <NaverFolderList />}
        {activeTab === "youtube" && <YoutubeChannelList />}
        {activeTab === "community" && <CommunityList />}
      </div>
    </div>
  );
}

/**
 * 네이버 폴더 목록 렌더링 컴포넌트
 */
function NaverFolderList() {
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = useNaverFolders();
  const showPopup = usePlacePopup((state) => state.show);

  if (isLoading) return <LoadingSkeleton />;

  const folders = data?.pages.flatMap((page) => page) || [];

  return (
    <div className="flex flex-col gap-10 py-6">
      {folders.map((folder) => (
        <section key={folder.folder_id} className="flex flex-col gap-4 px-4">
          {/* 제목 영역: 타이틀 + 개수 + 구독버튼 */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex flex-col gap-1 flex-1">
              <h3 className="text-xl font-black text-surface-900 dark:text-white leading-tight break-keep">
                {folder.name}
              </h3>
              <div className="flex items-center gap-1.5 text-sm font-medium text-surface-400">
                <span>{folder.place_count}개 매장</span>
              </div>
            </div>
            <Button variant="outline" size="sm" className="h-9 px-4 rounded-full border-surface-200 text-xs font-bold gap-1 flex-shrink-0">
              <Plus className="size-3.5" />
              구독
            </Button>
          </div>

          {folder.memo && (
            <p className="text-sm text-surface-500 dark:text-surface-400 line-clamp-2 -mt-2">
              {folder.memo}
            </p>
          )}

          {/* 장소 슬라이더 */}
          <div className="-mx-4">
            <PlaceSlider
              title=""
              items={folder.preview_places || []}
              onItemClick={showPopup}
              onMoreClick={() => {}}
              showMoreThreshold={10}
            />
          </div>
        </section>
      ))}
      
      {hasNextPage && (
        <div className="px-4 py-4">
          <Button 
            variant="ghost" 
            className="w-full text-surface-400" 
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
          >
            {isFetchingNextPage ? "로딩 중..." : "더 보기"}
          </Button>
        </div>
      )}
    </div>
  );
}

/**
 * 유튜브 채널 목록 렌더링 컴포넌트
 */
function YoutubeChannelList() {
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = useYoutubeChannels();
  const showPopup = usePlacePopup((state) => state.show);

  if (isLoading) return <LoadingSkeleton />;

  const channels = data?.pages.flatMap((page) => page) || [];

  return (
    <div className="flex flex-col gap-12 py-6">
      {channels.map((channel) => (
        <section key={channel.channel_id} className="flex flex-col gap-4 px-4">
          {/* 헤더: 채널 프로필(크게) + 이름 + 개수 + 구독버튼 */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-1 overflow-hidden">
              <div className="w-12 h-12 rounded-full bg-surface-200 overflow-hidden flex-shrink-0 border border-surface-100 dark:border-surface-800">
                <img 
                  src={channel.channel_thumbnail} 
                  alt={channel.channel_title} 
                  className="w-full h-full object-cover" 
                  loading="lazy"
                />
              </div>
              <div className="flex flex-col gap-0.5 overflow-hidden">
                <h3 className="text-xl font-black text-surface-900 dark:text-white leading-tight truncate">
                  {channel.channel_title}
                </h3>
                <div className="flex items-center gap-1.5 text-sm font-medium text-surface-400">
                  <span>{channel.place_count}개 매장</span>
                </div>
              </div>
            </div>
            <Button variant="outline" size="sm" className="h-9 px-4 rounded-full border-surface-200 text-xs font-bold gap-1 flex-shrink-0">
              <Plus className="size-3.5" />
              구독
            </Button>
          </div>

          {/* 장소 슬라이더 */}
          <div className="-mx-4">
            <PlaceSlider
              title=""
              items={channel.preview_places || []}
              onItemClick={showPopup}
              onMoreClick={() => {}}
              showMoreThreshold={10}
            />
          </div>
        </section>
      ))}

      {hasNextPage && (
        <div className="px-4 py-4">
          <Button 
            variant="ghost" 
            className="w-full text-surface-400" 
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
          >
            {isFetchingNextPage ? "로딩 중..." : "더 보기"}
          </Button>
        </div>
      )}
    </div>
  );
}

/**
 * 커뮤니티 목록 렌더링 컴포넌트
 */
function CommunityList() {
  const [selectedDomain, setSelectedDomain] = useState<string | null>(null);
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = useCommunityContents({ 
    domain: selectedDomain,
  });
  const showPopup = usePlacePopup((state) => state.show);

  const domains = [
    { id: null, label: "전체" },
    { id: "damoang.net", label: "다모앙" },
    { id: "clien.net", label: "클리앙" },
    { id: "bobaedream.co.kr", label: "보배드림" },
  ];

  if (isLoading) return <LoadingSkeleton />;

  const regions = data?.pages.flatMap((page) => page) || [];

  return (
    <div className="py-6">
      {/* 도메인 필터 */}
      <div className="flex items-center gap-2 px-4 mb-8 overflow-x-auto scrollbar-hide">
        {domains.map((domain) => (
          <button
            key={domain.id || 'all'}
            onClick={() => setSelectedDomain(domain.id)}
            className={cn(
              "px-4 py-1.5 rounded-full text-sm font-bold transition-all border shrink-0",
              selectedDomain === domain.id
                ? "bg-surface-900 text-white border-surface-900 dark:bg-white dark:text-black dark:border-white"
                : "bg-surface-50 text-surface-500 border-surface-100 dark:bg-surface-900 dark:text-surface-400 dark:border-surface-800"
            )}
          >
            {domain.label}
          </button>
        ))}
      </div>

      {/* 지역별 섹션 */}
      {regions.map(region => (
        <PlaceSlider
          key={region.region_name}
          title={`${region.region_name}지역`}
          countLabel={`${region.place_count}개 매장`}
          items={region.preview_contents}
          onItemClick={showPopup}
        />
      ))}

      {hasNextPage && (
        <div className="px-4 py-4">
          <Button 
            variant="ghost" 
            className="w-full text-surface-400" 
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
          >
            {isFetchingNextPage ? "로딩 중..." : "더 보기"}
          </Button>
        </div>
      )}
    </div>
  );
}

/**
 * 로딩 상태용 스켈레톤 컴포넌트
 */
function LoadingSkeleton() {
  return (
    <div className="flex flex-col gap-8 py-6 px-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex flex-col gap-4 animate-pulse">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-surface-200" />
              <div className="w-24 h-4 bg-surface-200 rounded" />
            </div>
            <div className="w-16 h-8 bg-surface-200 rounded-full" />
          </div>
          <div className="space-y-2">
            <div className="w-3/4 h-6 bg-surface-200 rounded" />
            <div className="w-full h-4 bg-surface-200 rounded" />
          </div>
          <div className="flex gap-3 overflow-hidden">
            {[1, 2, 3].map((j) => (
              <div key={j} className="flex-shrink-0 w-36 aspect-[3/4] bg-surface-200 rounded-xl" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
