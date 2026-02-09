import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router";
import { usePlacePopup } from "@/shared/lib/place-popup";
import { useFeaturePageStore } from "@/shared/lib/feature-page-store";
import { useNaverFolders, useYoutubeChannels, useCommunityContents, useRegionContents, useSocialContents } from "@/entities/place/queries";
import { useToggleFeatureSubscription, useMySubscriptions } from "@/entities/folder/queries";
import { useUserStore } from "@/entities/user";
import { useAuthModalStore } from "@/features/auth/model/useAuthModalStore";
import { DetectiveList } from "@/features/folder/ui/DetectiveList";
import { cn } from "@/shared/lib/utils";
import { Button, PlaceSlider, HorizontalScroll } from "@/shared/ui";
import { Loader2, MapPin, Youtube, MessageSquare, Search, Instagram, Bell, CircleUser } from "lucide-react";
import naverIcon from "@/assets/images/naver-map-logo.png";

import { PageHeader } from "@/shared/ui/PageHeader";

/**
 * 피쳐 페이지 컴포넌트
 */
export function FeaturePage() {
  const navigate = useNavigate();
  const { tab } = useParams();
  const activeTab = tab || "detective";
  
  const { scrollPositions, setScrollPosition } = useFeaturePageStore();

  const tabs = [
    { id: "detective", label: "맛탐정" },
    { id: "community", label: "커뮤니티" },
    { id: "social", label: "소셜" },
    { id: "folder", label: "플레이스" },
    { id: "youtube", label: "유튜브" },
    { id: "region", label: "지역" },
  ];

  // 페이지 마운트 시 window 스크롤 초기화 (다른 페이지에서 스크롤 후 진입 시 헤더가 밀리는 문제 방지)
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, []);

  // 탭 변경 시 또는 마운트 시 스크롤 위치 복원
  useEffect(() => {
    const savedPosition = useFeaturePageStore.getState().scrollPositions[activeTab] || 0;
    const timeoutId = setTimeout(() => {
      window.scrollTo({ top: savedPosition, left: 0, behavior: "auto" });
    }, 0);
    return () => clearTimeout(timeoutId);
  }, [activeTab]);

  // 스크롤 발생 시 위치 저장
  useEffect(() => {
    const handleScroll = () => {
      setScrollPosition(activeTab, window.scrollY);
    };
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [activeTab, setScrollPosition]);

  const { isAuthenticated, profile } = useUserStore();
  const { openLogin } = useAuthModalStore();

  const handleProfileClick = () => {
    if (!isAuthenticated) {
      openLogin();
      return;
    }
    navigate("/profile");
  };

  return (
    <div className="flex flex-col min-h-dvh bg-white dark:bg-surface-950">
      {/* 상단 헤더 */}
      <PageHeader 
        tabs={tabs} 
        activeTab={activeTab} 
        basePath="/feature"
        title="탐색"
        actions={
          <>
            <button 
              onClick={() => navigate("/search")}
              className="p-1 text-surface-500 dark:text-surface-400 focus:outline-none"
            >
              <Search className="size-6" />
            </button>
            <button 
              onClick={handleProfileClick}
              className="p-1 text-surface-900 dark:text-white focus:outline-none"
            >
              {isAuthenticated && profile?.profile_image_url ? (
                <div className="size-7 rounded-full ring-2 ring-surface-100 dark:ring-surface-800 overflow-hidden">
                  <img 
                    src={profile.profile_image_url} 
                    alt="프로필" 
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <CircleUser className="size-7" />
              )}
            </button>
          </>
        }
      />

      {/* 컨텐츠 영역: 활성 탭만 렌더링 */}
      <main className="flex-1 w-full max-w-lg mx-auto pt-28 pb-32 bg-white dark:bg-surface-950 min-h-dvh">
        <div className="pt-2" />
        {activeTab === "detective" && <DetectiveList />}
        {activeTab === "community" && <CommunityList />}
        {activeTab === "social" && <SocialList />}
        {activeTab === "folder" && <NaverFolderList />}
        {activeTab === "youtube" && <YoutubeChannelList />}
        {activeTab === "region" && <RegionList />}
      </main>
    </div>
  );
}

/**
 * 피쳐 페이지 상단 안내 공지 컴포넌트
 */
function FeatureInfoNotice({ icon: Icon, title, description }: { icon: any, title: string, description: string }) {
  return (
    <div className="mx-4 mb-2 p-4 rounded-2xl bg-white dark:bg-surface-900/50 border border-surface-100 dark:border-surface-800 flex items-start gap-3">
      <div className="p-2 rounded-xl bg-surface-50 dark:bg-surface-800 shadow-sm flex-shrink-0">
        <Icon className="size-5 text-surface-600 dark:text-surface-400" />
      </div>
      <div className="flex flex-col gap-0.5 pt-0.5">
        <h4 className="text-sm font-medium text-surface-900 dark:text-white leading-tight">{title}</h4>
        <p className="text-xs text-surface-500 dark:text-surface-400 leading-relaxed">{description}</p>
      </div>
    </div>
  );
}

/**
 * 피쳐 행 헤더 컴포넌트
 */
function FeatureRowHeader({ 
  title, 
  thumbnail, 
  count, 
  onTitleClick, 
  subscribeType, 
  subscribeId 
}: { 
  title: string; 
  thumbnail?: string; 
  count: number; 
  onTitleClick?: () => void;
  subscribeType: string;
  subscribeId: string;
}) {
  return (
    <div className="flex items-center gap-2.5 overflow-hidden">
      {thumbnail && (
        <div 
          className="w-10 h-10 rounded-full bg-surface-200 overflow-hidden flex-shrink-0 border border-surface-100 dark:border-surface-800 cursor-pointer"
          onClick={onTitleClick}
        >
          <img 
            src={thumbnail} 
            alt={title} 
            className="w-full h-full object-cover" 
            loading="lazy"
          />
        </div>
      )}
      <div className="flex items-start justify-between flex-1 gap-2 overflow-hidden">
        <div className="flex flex-col gap-0.5 overflow-hidden">
          <h3 
            className="text-lg font-medium text-surface-900 dark:text-white leading-tight truncate cursor-pointer hover:underline underline-offset-4"
            onClick={onTitleClick}
          >
            {title}
          </h3>
          <span className="text-xs font-medium text-surface-400">
            {count.toLocaleString()}개 매장
          </span>
        </div>
        <FeatureSubscribeButton type={subscribeType} id={subscribeId} />
      </div>
    </div>
  );
}

/**
 * 네이버 폴더 목록 렌더링 컴포넌트
 */
function NaverFolderList() {
  const navigate = useNavigate();
  const { show: showPlaceModal } = usePlacePopup();
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = useNaverFolders();
  // 전역 상태 기반 모달: 부모 페이지 재마운트 없이 모달 열기
  const showPopup = (id: string) => showPlaceModal(id);

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
      <FeatureInfoNotice 
        icon={MapPin} 
        title="플레이스 추천" 
        description="네이버 지도 등에서 엄선된 테마별 맛집 리스트입니다." 
      />
      {folders.map((folder) => (
        <section key={folder.folder_id} className="flex flex-col gap-2 px-4">
          <FeatureRowHeader 
            title={folder.name}
            thumbnail={naverIcon}
            count={folder.place_count}
            onTitleClick={() => navigate(`/feature/detail/folder/${folder.folder_id}`)}
            subscribeType="naver_folder"
            subscribeId={folder.folder_id.toString()}
          />

          {/* 장소 슬라이더 */}
          <div className="-mx-4">
            <PlaceSlider
              title=""
              items={folder.preview_places || []}
              onItemClick={showPopup}
              onMoreClick={() => navigate(`/feature/detail/folder/${folder.folder_id}`)}
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
 * 지역별 통합 목록 렌더링 컴포넌트
 */
function RegionList() {
  const navigate = useNavigate();
  const { show: showPlaceModal } = usePlacePopup();
  const { regionSource: selectedSource, setRegionSource: setSelectedSource } = useFeaturePageStore();
  
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = useRegionContents({ 
    source: selectedSource,
  });
  
  // 전역 상태 기반 모달: 부모 페이지 재마운트 없이 모달 열기
  const showPopup = (id: string) => showPlaceModal(id);

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

  const sources = [
    { id: null, label: "전체" },
    { id: "community", label: "커뮤니티" },
    { id: "detective", label: "맛탐정" },
    { id: "folder", label: "플레이스" },
    { id: "youtube", label: "유튜브" },
  ];

  const regions = data?.pages.flatMap((page) => page) || [];

  return (
    <div className="py-4 flex flex-col gap-4">
      <FeatureInfoNotice 
        icon={MapPin} 
        title="지역 추천" 
        description="다양한 소스에서 엄선된 지역별 맛집 리스트입니다." 
      />
      {/* 소스 필터 */}
      <HorizontalScroll 
        containerClassName="flex items-center gap-2 px-4 mb-2"
        scrollAmount={150}
        fadeEdges={false}
      >
        {sources.map((source) => (
          <button
            key={source.id || 'all'}
            onClick={() => setSelectedSource(source.id)}
            disabled={isLoading}
            className={cn(
              "px-4 py-1.5 rounded-full text-sm font-medium transition-colors border shrink-0",
              selectedSource === source.id
                ? "bg-surface-900 text-white border-surface-900 dark:bg-white dark:text-black dark:border-white"
                : "bg-white text-surface-500 border-surface-100 dark:bg-surface-900 dark:text-surface-400 dark:border-surface-800",
              isLoading && "opacity-50 cursor-not-allowed"
            )}
          >
            {source.label}
          </button>
        ))}
      </HorizontalScroll>

      {isLoading ? (
        <LoadingSkeleton />
      ) : (
        <>
          {/* 지역별 섹션 */}
          {regions.map(region => (
            <section key={region.region_name} className="flex flex-col gap-2 px-4">
              <FeatureRowHeader 
                title={`${region.region_name}지역`}
                count={region.place_count}
                onTitleClick={() => navigate(`/feature/detail/region/${region.region_name}${selectedSource ? `?source=${selectedSource}` : ''}`)}
                subscribeType="region_recommend"
                subscribeId={region.region_name}
              />
              <div className="-mx-4">
                <PlaceSlider
                  title=""
                  items={region.preview_contents}
                  onItemClick={showPopup}
                  onMoreClick={() => navigate(`/feature/detail/region/${region.region_name}${selectedSource ? `?source=${selectedSource}` : ''}`)}
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
        </>
      )}
    </div>
  );
}

/**
 * 유튜브 채널 목록 렌더링 컴포넌트
 */
function YoutubeChannelList() {
  const navigate = useNavigate();
  const { show: showPlaceModal } = usePlacePopup();
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = useYoutubeChannels();
  // 전역 상태 기반 모달: 부모 페이지 재마운트 없이 모달 열기
  const showPopup = (id: string) => showPlaceModal(id);

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
      <FeatureInfoNotice 
        icon={Youtube} 
        title="유튜브 맛집" 
        description="인기 유튜브 채널에서 소개된 맛집들을 확인해보세요." 
      />
      {channels.map((channel) => (
        <section key={channel.channel_id} className="flex flex-col gap-2 px-4">
          <FeatureRowHeader 
            title={channel.channel_title}
            thumbnail={channel.channel_thumbnail}
            count={channel.place_count}
            onTitleClick={() => navigate(`/feature/detail/youtube/${channel.channel_id}`)}
            subscribeType="youtube_channel"
            subscribeId={channel.channel_id}
          />

          {/* 장소 슬라이더 */}
          <div className="-mx-4">
            <PlaceSlider
              title=""
              items={channel.preview_places || []}
              onItemClick={showPopup}
              onMoreClick={() => navigate(`/feature/detail/youtube/${channel.channel_id}`)}
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
  const { show: showPlaceModal } = usePlacePopup();
  const { communityDomain: selectedDomain, setCommunityDomain: setSelectedDomain } = useFeaturePageStore();
  
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = useCommunityContents({ 
    domain: selectedDomain,
  });
  
  // 전역 상태 기반 모달: 부모 페이지 재마운트 없이 모달 열기
  const showPopup = (id: string) => showPlaceModal(id);

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
    <div className="py-4 flex flex-col gap-4">
      <FeatureInfoNotice 
        icon={MessageSquare} 
        title="커뮤니티 픽" 
        description="다모앙, 클리앙 등 주요 커뮤니티 유저들이 추천하는 지역별 맛집입니다." 
      />
      {/* 도메인 필터 */}
      <HorizontalScroll 
        containerClassName="flex items-center gap-2 px-4 mb-2"
        scrollAmount={150}
        fadeEdges={false}
      >
        {domains.map((domain) => (
          <button
            key={domain.id || 'all'}
            onClick={() => setSelectedDomain(domain.id)}
            disabled={isLoading}
            className={cn(
              "px-4 py-1.5 rounded-full text-sm font-medium transition-colors border shrink-0",
              selectedDomain === domain.id 
                ? "bg-surface-900 text-white border-surface-900 dark:bg-white dark:text-black dark:border-white" 
                : "bg-white text-surface-500 border-surface-100 dark:bg-surface-900 dark:text-surface-400 dark:border-surface-800",
              isLoading && "opacity-50 cursor-not-allowed"
            )}
          >
            {domain.label}
          </button>
        ))}
      </HorizontalScroll>

      {isLoading ? (
        <LoadingSkeleton />
      ) : (
        <>
          {/* 지역별 섹션 */}
          {regions.map(region => (
            <section key={region.region_name} className="flex flex-col gap-2 px-4">
              <FeatureRowHeader 
                title={`${region.region_name}지역`}
                count={region.place_count}
                onTitleClick={() => navigate(`/feature/detail/community/${region.region_name}${selectedDomain ? `?domain=${selectedDomain}` : ''}`)}
                subscribeType="community_region"
                subscribeId={region.region_name}
              />
              <div className="-mx-4">
                <PlaceSlider
                  title=""
                  items={region.preview_contents}
                  onItemClick={showPopup}
                  onMoreClick={() => navigate(`/feature/detail/community/${region.region_name}${selectedDomain ? `?domain=${selectedDomain}` : ''}`)}
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
        </>
      )}
    </div>
  );
}

/**
 * 소셜 목록 렌더링 컴포넌트
 */
function SocialList() {
  const navigate = useNavigate();
  const { show: showPlaceModal } = usePlacePopup();
  const { socialService: selectedService, setSocialService: setSelectedService } = useFeaturePageStore();
  
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = useSocialContents({ 
    service: selectedService,
  });
  
  // 전역 상태 기반 모달: 부모 페이지 재마운트 없이 모달 열기
  const showPopup = (id: string) => showPlaceModal(id);

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

  const services = [
    { id: null, label: "전체" },
    { id: "instagram", label: "Instagram" },
    { id: "threads", label: "Threads" },
  ];

  const regions = data?.pages.flatMap((page) => page) || [];

  return (
    <div className="py-4 flex flex-col gap-4">
      <FeatureInfoNotice 
        icon={Instagram} 
        title="소셜 픽" 
        description="인스타그램, 쓰레드에서 공유된 지역별 맛집입니다." 
      />
      {/* 서비스 필터 */}
      <HorizontalScroll 
        containerClassName="flex items-center gap-2 px-4 mb-2"
        scrollAmount={150}
        fadeEdges={false}
      >
        {services.map((service) => (
          <button
            key={service.id || 'all'}
            onClick={() => setSelectedService(service.id)}
            disabled={isLoading}
            className={cn(
              "px-4 py-1.5 rounded-full text-sm font-medium transition-colors border shrink-0",
              selectedService === service.id 
                ? "bg-surface-900 text-white border-surface-900 dark:bg-white dark:text-black dark:border-white" 
                : "bg-white text-surface-500 border-surface-100 dark:bg-surface-900 dark:text-surface-400 dark:border-surface-800",
              isLoading && "opacity-50 cursor-not-allowed"
            )}
          >
            {service.label}
          </button>
        ))}
      </HorizontalScroll>

      {isLoading ? (
        <LoadingSkeleton />
      ) : (
        <>
          {/* 지역별 섹션 */}
          {regions.map(region => (
            <section key={region.region_name} className="flex flex-col gap-2 px-4">
              <FeatureRowHeader 
                title={`${region.region_name}지역`}
                count={region.place_count}
                onTitleClick={() => navigate(`/feature/detail/social/${region.region_name}${selectedService ? `?domain=${selectedService}` : ''}`)}
                subscribeType="social_region"
                subscribeId={region.region_name}
              />
              <div className="-mx-4">
                <PlaceSlider
                  title=""
                  items={region.preview_contents}
                  onItemClick={showPopup}
                  onMoreClick={() => navigate(`/feature/detail/social/${region.region_name}${selectedService ? `?domain=${selectedService}` : ''}`)}
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

/**
 * 공통 구독 버튼 컴포넌트
 */
function FeatureSubscribeButton({ type, id }: { type: string; id: string }) {
  const { isAuthenticated } = useUserStore();
  const { openLogin } = useAuthModalStore();
  const { data: mySubscriptions } = useMySubscriptions();
  const { 
    mutate: toggleSubscription,
    isPending: isTogglePending,
    variables: toggledFeature
  } = useToggleFeatureSubscription();

  const isSubscribed = mySubscriptions?.some(
    (sub: any) => sub.subscription_type === type && sub.feature_id === id && sub.is_subscribed !== false
  );

  // 낙관적 업데이트를 위한 UI 상태 계산
  const isCurrentlyToggling = isTogglePending && toggledFeature?.id === id && toggledFeature?.type === type;
  const displaySubscribed = isCurrentlyToggling ? !isSubscribed : isSubscribed;

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isAuthenticated) {
      openLogin();
      return;
    }
    toggleSubscription({ type, id });
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleToggle}
      disabled={isCurrentlyToggling}
      className={cn(
        "flex-shrink-0 rounded-full h-8 font-medium transition-colors px-3",
        displaySubscribed 
          ? "bg-primary-50 border-primary-200 text-primary-600 dark:bg-primary-900/20 dark:border-primary-800" 
          : "border-surface-200 dark:border-surface-700"
      )}
    >
      <span className="text-xs">{displaySubscribed ? "구독중" : "구독"}</span>
    </Button>
  );
}
