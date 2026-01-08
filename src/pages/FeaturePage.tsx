import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router";
import { useNaverFolders, useYoutubeChannels, useCommunityContents } from "@/entities/place/queries";
import { cn } from "@/shared/lib/utils";
import { Button, PlaceSlider } from "@/shared/ui";
import { Loader2 } from "lucide-react";

/**
 * 피쳐 페이지 컴포넌트
 */
export function FeaturePage() {
  const navigate = useNavigate();
  const { tab } = useParams();
  const activeTab = tab || "folder";

  const tabs = [
    { id: "folder", label: "플레이스" },
    { id: "youtube", label: "유튜브" },
    { id: "community", label: "커뮤니티" },
  ];

  return (
    <div className="flex flex-col h-[calc(100dvh-56px)] bg-white dark:bg-surface-950">
      {/* 상단 헤더 - 타이포 중심 */}
      <div className="bg-white/80 backdrop-blur-md dark:bg-surface-950/80 px-5 pt-8 pb-4 z-10 flex-shrink-0">
        <div className="flex items-center gap-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => navigate(`/feature/${tab.id}`)}
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
        </div>
      </div>

      {/* 컨텐츠 영역: 각 탭이 독립적인 스크롤 컨테이너를 가짐 */}
      <div className="flex-1 relative overflow-hidden">
        <div className={cn("absolute inset-0 overflow-y-auto scrollbar-hide", activeTab !== "folder" && "hidden")}>
          <NaverFolderList />
        </div>
        <div className={cn("absolute inset-0 overflow-y-auto scrollbar-hide", activeTab !== "youtube" && "hidden")}>
          <YoutubeChannelList />
        </div>
        <div className={cn("absolute inset-0 overflow-y-auto scrollbar-hide", activeTab !== "community" && "hidden")}>
          <CommunityList />
        </div>
      </div>
    </div>
  );
}

/**
 * 네이버 폴더 목록 렌더링 컴포넌트
 */
function NaverFolderList() {
  const navigate = useNavigate();
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = useNaverFolders();
  const showPopup = (id: string) => navigate(`/p/status/${id}`);

  const observerTarget = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!hasNextPage || isFetchingNextPage) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          fetchNextPage();
        }
      },
      { threshold: 0, rootMargin: '200px' }
    );

    const currentTarget = observerTarget.current;
    if (currentTarget) observer.observe(currentTarget);

    return () => {
      if (currentTarget) observer.unobserve(currentTarget);
    };
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  if (isLoading) return <LoadingSkeleton />;

  const folders = data?.pages.flatMap((page) => page) || [];

  return (
    <div className="flex flex-col gap-4 py-4">
      {folders.map((folder) => (
        <section key={folder.folder_id} className="flex flex-col gap-2 px-4">
          {/* 제목 영역: 타이틀 + 개수 */}
          <div className="flex items-end justify-between gap-2">
            <h3 className="text-xl font-black text-surface-900 dark:text-white leading-tight break-keep">
              {folder.name}
            </h3>
            <span className="text-sm font-medium text-surface-400 mb-0.5 whitespace-nowrap">
              {folder.place_count}개 매장
            </span>
          </div>

          {/* 장소 슬라이더 */}
          <div className="-mx-4">
            <PlaceSlider
              title=""
              items={folder.preview_places || []}
              onItemClick={showPopup}
              onMoreClick={() => {}}
              showMoreThreshold={10}
              showRating={false}
              snap={false}
            />
          </div>
        </section>
      ))}
      
      {hasNextPage && (
        <div ref={observerTarget} className="p-12 flex justify-center">
          <Loader2 className="size-6 text-surface-300 animate-spin" />
        </div>
      )}
    </div>
  );
}

/**
 * 유튜브 채널 목록 렌더링 컴포넌트
 */
function YoutubeChannelList() {
  const navigate = useNavigate();
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = useYoutubeChannels();
  const showPopup = (id: string) => navigate(`/p/status/${id}`);

  const observerTarget = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!hasNextPage || isFetchingNextPage) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          fetchNextPage();
        }
      },
      { threshold: 0, rootMargin: '200px' }
    );

    const currentTarget = observerTarget.current;
    if (currentTarget) observer.observe(currentTarget);

    return () => {
      if (currentTarget) observer.unobserve(currentTarget);
    };
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  if (isLoading) return <LoadingSkeleton />;

  const channels = data?.pages.flatMap((page) => page) || [];

  return (
    <div className="flex flex-col gap-4 py-4">
      {channels.map((channel) => (
        <section key={channel.channel_id} className="flex flex-col gap-2 px-4">
          {/* 헤더: 채널 프로필 + 이름 + 개수 */}
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-10 h-10 rounded-full bg-surface-200 overflow-hidden flex-shrink-0 border border-surface-100 dark:border-surface-800">
              <img 
                src={channel.channel_thumbnail} 
                alt={channel.channel_title} 
                className="w-full h-full object-cover" 
                loading="lazy"
              />
            </div>
            <div className="flex items-end justify-between flex-1 gap-2 overflow-hidden">
              <h3 className="text-lg font-black text-surface-900 dark:text-white leading-tight truncate">
                {channel.channel_title}
              </h3>
              <span className="text-xs font-medium text-surface-400 mb-0.5 whitespace-nowrap">
                {channel.place_count}개 매장
              </span>
            </div>
          </div>

          {/* 장소 슬라이더 */}
          <div className="-mx-4">
            <PlaceSlider
              title=""
              items={channel.preview_places || []}
              onItemClick={showPopup}
              onMoreClick={() => {}}
              showMoreThreshold={10}
              showRating={false}
              snap={false}
            />
          </div>
        </section>
      ))}

      {hasNextPage && (
        <div ref={observerTarget} className="p-12 flex justify-center">
          <Loader2 className="size-6 text-surface-300 animate-spin" />
        </div>
      )}
    </div>
  );
}

/**
 * 커뮤니티 목록 렌더링 컴포넌트
 */
function CommunityList() {
  const navigate = useNavigate();
  const [selectedDomain, setSelectedDomain] = useState<string | null>(null);
  
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = useCommunityContents({ 
    domain: selectedDomain,
  });
  
  const showPopup = (id: string) => navigate(`/p/status/${id}`);

  const observerTarget = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!hasNextPage || isFetchingNextPage) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          fetchNextPage();
        }
      },
      { threshold: 0, rootMargin: '200px' }
    );

    const currentTarget = observerTarget.current;
    if (currentTarget) observer.observe(currentTarget);

    return () => {
      if (currentTarget) observer.unobserve(currentTarget);
    };
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const domains = [
    { id: null, label: "전체" },
    { id: "damoang.net", label: "다모앙" },
    { id: "clien.net", label: "클리앙" },
    { id: "bobaedream.co.kr", label: "보배드림" },
  ];

  const regions = data?.pages.flatMap((page) => page) || [];

  return (
    <div className="py-4 flex flex-col gap-2">
      {/* 도메인 필터 */}
      <div className="flex items-center gap-2 px-4 mb-4 overflow-x-auto scrollbar-hide">
        {domains.map((domain) => (
          <button
            key={domain.id || 'all'}
            onClick={() => setSelectedDomain(domain.id)}
            disabled={isLoading}
            className={cn(
              "px-4 py-1.5 rounded-full text-sm font-bold transition-all border shrink-0",
              selectedDomain === domain.id
                ? "bg-surface-900 text-white border-surface-900 dark:bg-white dark:text-black dark:border-white"
                : "bg-surface-50 text-surface-500 border-surface-100 dark:bg-surface-900 dark:text-surface-400 dark:border-surface-800",
              isLoading && "opacity-50 cursor-not-allowed"
            )}
          >
            {domain.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <LoadingSkeleton />
      ) : (
        <>
          {/* 지역별 섹션 */}
          {regions.map(region => (
            <PlaceSlider
              key={region.region_name}
              title={`${region.region_name}지역`}
              countLabel={`${region.place_count}개 매장`}
              items={region.preview_contents}
              onItemClick={showPopup}
              showRating={false}
              snap={false}
            />
          ))}

          {hasNextPage && (
            <div ref={observerTarget} className="p-12 flex justify-center">
              <Loader2 className="size-6 text-surface-300 animate-spin" />
            </div>
          )}
        </>
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
