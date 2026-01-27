import { useState, useMemo } from "react";
import { useNavigate } from "react-router";
import { Plus, ChevronRight, User, MapPin, Youtube, Sparkles, Flame, Play, ArrowRight, Heart } from "lucide-react";
import { useMyFolders, useMySubscriptions, usePublicFolders } from "@/entities/folder/queries";
import { useHomeDiscover } from "@/entities/home/queries";
import { Skeleton } from "@/shared/ui";
import { cn, getAvatarUrl } from "@/shared/lib/utils";
import { convertToNaverResizeImageUrl } from "@/shared/lib/naver";
import { useUserStore } from "@/entities/user";
import { useAuthModalStore } from "@/features/auth/model/useAuthModalStore";
import { usePlacePopup } from "@/shared/lib/place-popup";
import naverIcon from "@/assets/images/naver-map-logo.png";

/**
 * 인기 음식점 카드
 */
function PopularPlaceCard({
  rank,
  place,
  onClick,
}: {
  rank: number;
  place: any;
  onClick: () => void;
}) {
  return (
    <div onClick={onClick} className="flex-shrink-0 w-32 cursor-pointer group">
      <div className="relative aspect-[3/4] rounded-2xl overflow-hidden bg-surface-100 dark:bg-surface-800 mb-2">
        {place.thumbnail ? (
          <img
            src={convertToNaverResizeImageUrl(place.thumbnail)}
            alt={place.name}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-rose-100 to-amber-100 dark:from-surface-700 dark:to-surface-600 flex items-center justify-center">
            <MapPin className="size-8 text-rose-300" />
          </div>
        )}

        {/* Rank */}
        <div className={cn(
          "absolute top-2 left-2 w-6 h-6 rounded-full flex items-center justify-center text-xs font-black",
          rank === 1 ? "bg-amber-400 text-amber-900" :
          rank === 2 ? "bg-surface-200 text-surface-600" :
          rank === 3 ? "bg-amber-600 text-white" :
          "bg-black/40 text-white"
        )}>
          {rank}
        </div>

        {/* Gradient */}
        <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/60 to-transparent" />

        {/* Score */}
        <div className="absolute bottom-2 left-2 right-2">
          <span className="text-white/80 text-[10px] font-medium">{place.popularity_score}회 저장/언급</span>
        </div>
      </div>
      <h4 className="text-xs font-semibold text-surface-900 dark:text-white line-clamp-1 leading-tight mb-0.5">{place.name}</h4>
      <p className="text-[10px] text-surface-400 line-clamp-1">{place.category}</p>
    </div>
  );
}

/**
 * 폴더/채널에서 첫 번째 유효한 이미지 URL 추출
 */
function getFirstImage(item: any): string | undefined {
  if (!item) return undefined;
  
  // preview_places에서 이미지 추출
  const places = item.preview_places || [];
  for (const place of places) {
    if (place.thumbnail) return place.thumbnail;
    if (place.images?.[0]) return place.images[0];
    if (place.image_urls?.[0]) return place.image_urls[0];
    if (place.place_images?.[0]) return place.place_images[0];
  }
  
  // 채널 썸네일
  if (item.channel_thumbnail) return item.channel_thumbnail;
  
  return undefined;
}

/**
 * 폴더/채널에서 여러 이미지 URL 추출
 */
function getImages(item: any, count: number = 4): string[] {
  if (!item) return [];
  
  // 이미 images 배열이 있는 경우 (예: discover.json의 naverFolders)
  if (Array.isArray(item.images) && item.images.length > 0) {
    // 1~4개 사이의 랜덤한 개수 선택
    const randomCount = Math.floor(Math.random() * count) + 1;
    return [...item.images].sort(() => Math.random() - 0.5).slice(0, randomCount);
  }
  
  const images: string[] = [];
  const places = item.preview_places || [];
  
  for (const place of places) {
    if (images.length >= count) break;
    const img = place.thumbnail || place.images?.[0] || place.image_urls?.[0] || place.place_images?.[0];
    if (img && !images.includes(img)) {
      images.push(img);
    }
  }
  
  return images;
}

export function HomePage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useUserStore();
  const { openLogin } = useAuthModalStore();
  const { show: showPlaceModal } = usePlacePopup();

  const [activeTab, setActiveTab] = useState<"foryou" | "following">("foryou");

  // Data Fetching
  const { data: myFolders, isLoading: isMyFoldersLoading } = useMyFolders();
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

  return (
    <div className="min-h-screen bg-[#FAFAF9] dark:bg-surface-950">
      {/* Header - 소셜 느낌의 정돈된 헤더 */}
      <header className="sticky top-0 z-40 bg-[#FAFAF9]/95 dark:bg-surface-950/95 backdrop-blur-md border-b border-surface-100 dark:border-surface-800">
        <div className="px-5 pt-6 pb-0">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-black text-surface-900 dark:text-white tracking-tight">
              맛탐정
            </h1>
            <div className="flex items-center gap-3">
              <button 
                onClick={handleCreateFolder}
                className="w-9 h-9 rounded-full bg-surface-100 dark:bg-surface-800 flex items-center justify-center text-surface-600 dark:text-surface-300"
              >
                <Plus className="size-5" />
              </button>
              <button
                onClick={() => navigate("/profile")}
                className="w-9 h-9 rounded-full bg-surface-100 dark:bg-surface-800 flex items-center justify-center text-surface-600 dark:text-surface-300"
              >
                <User className="size-5" />
              </button>
            </div>
          </div>
          
          {/* Tab Navigation */}
          <div className="flex gap-6 relative">
            <button
              onClick={() => setActiveTab("foryou")}
              className={cn(
                "pb-3 text-[15px] font-bold transition-all relative",
                activeTab === "foryou"
                  ? "text-surface-900 dark:text-white"
                  : "text-surface-400 dark:text-surface-500"
              )}
            >
              추천
              {activeTab === "foryou" && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-surface-900 dark:bg-white rounded-full" />
              )}
            </button>
            <button
              onClick={() => setActiveTab("following")}
              className={cn(
                "pb-3 text-[15px] font-bold transition-all relative",
                activeTab === "following"
                  ? "text-surface-900 dark:text-white"
                  : "text-surface-400 dark:text-surface-500"
              )}
            >
              팔로잉
              {activeTab === "following" && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-surface-900 dark:bg-white rounded-full" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Stories - 사용자 및 유튜브 채널 목업 */}
      <section className="py-4 px-4">
        <div className="flex gap-3 overflow-x-auto no-scrollbar" style={{ WebkitOverflowScrolling: 'touch' }}>
          {/* [개발용 목업] 사용자 및 유튜브 채널 목록을 표시합니다. 
              추후 API에서 사용자(users) 및 유튜브 채널(youtubeChannels) 데이터를 받아올 예정입니다. */}
          {isDiscoverLoading ? (
            [...Array(6)].map((_, i) => (
              <div key={i} className="flex flex-col items-center gap-2 flex-shrink-0">
                <Skeleton className="w-16 h-16 rounded-xl" />
                <Skeleton className="w-12 h-3 rounded" />
              </div>
            ))
          ) : (
            <>
              {/* 사용자 목업 데이터 */}
              {discoverData?.users?.slice(0, 5).map((user: any, i: number) => (
                <StoryBox
                  key={`user-${user.id || i}`}
                  image={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.id || i + 100}`}
                  label={user.nickname || '사용자'}
                  onClick={() => {}}
                />
              ))}
              {/* 유튜브 채널 목업 데이터 */}
              {discoverData?.youtubeChannels?.slice(0, 5).map((channel: any, i: number) => (
                <StoryBox
                  key={`youtube-${channel.id || i}`}
                  image={`https://api.dicebear.com/7.x/avataaars/svg?seed=${channel.id || i + 200}`}
                  label={channel.title || '유튜브'}
                  onClick={() => {}}
                  badge="youtube"
                />
              ))}
            </>
          )}
        </div>
      </section>

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
    </div>
  );
}

/**
 * 사각형 스토리 컴포넌트 (사용자/유튜브 채널용)
 */
function StoryBox({
  image,
  label,
  onClick,
  badge,
}: {
  image: string;
  label: string;
  onClick: () => void;
  badge?: 'youtube';
}) {
  return (
    <button onClick={onClick} className="flex flex-col items-center gap-1.5 flex-shrink-0 group">
      <div className="relative w-16 h-16 rounded-2xl overflow-hidden bg-surface-100 dark:bg-surface-800 border border-surface-200 dark:border-surface-700">
        <img
          src={image}
          alt={label}
          className="w-full h-full object-cover"
          loading="lazy"
        />
        {/* 유튜브 뱃지 */}
        {badge === 'youtube' && (
          <div className="absolute top-1 right-1 w-5 h-5 rounded-lg bg-red-500 flex items-center justify-center shadow-sm">
            <Play className="size-2.5 text-white fill-white" />
          </div>
        )}
        {/* 이름 오버레이 (박스 하단) */}
        <div className="absolute inset-x-0 bottom-0 bg-black/40 backdrop-blur-[2px] py-1 px-1">
          <span className="text-[9px] text-white font-bold truncate block text-center leading-none">
            {label}
          </span>
        </div>
      </div>
    </button>
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
  const navigate = useNavigate();

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
    return (
      <div className="px-4 pb-32">
        <GridSkeleton />
      </div>
    );
  }

  return (
    <div className="pb-32">
      {/* Hero Section */}
      {publicFolders?.[0] && (
        <section className="px-4 mb-8">
          <HeroCard folder={publicFolders[0]} onClick={() => navigate(`/folder/${publicFolders[0].id}`)} />
        </section>
      )}

      {/* Top Sources - 가로 스크롤 */}
      <section className="mb-8">
        <div className="flex items-center justify-between px-4 mb-4">
          <div className="flex items-center gap-2">
            <Flame className="size-4 text-rose-500" />
            <h2 className="text-base font-bold text-surface-900 dark:text-white">인기 음식점</h2>
          </div>
          <button onClick={() => navigate("/feature")} className="text-xs text-surface-400 flex items-center gap-0.5">
            더보기 <ChevronRight className="size-3" />
          </button>
        </div>

        <div className="flex gap-3 px-4 overflow-x-auto no-scrollbar" style={{ WebkitOverflowScrolling: 'touch' }}>
          {discoverData?.popularPlaces?.map((place: any, i: number) => (
            <PopularPlaceCard
              key={place.id}
              rank={i + 1}
              place={place}
              onClick={() => showPlaceModal(place.id)}
            />
          ))}
        </div>
      </section>

      {/* Discover Grid - Pinterest 스타일 */}
      <section className="px-4">
        <h2 className="text-base font-bold text-surface-900 dark:text-white mb-4">발견하기</h2>
        <div className="columns-2 gap-3">
          {mixedContent.slice(1).map((item, index) => (
            <CollectionCard
              key={`${item.type}-${item.data.id || item.data.folder_id || item.data.channel_id}`}
              item={item}
              index={index}
              onClick={() => {
                if (item.type === 'folder') navigate(`/folder/${item.data.id}`);
                else if (item.type === 'place') showPlaceModal(item.data.id);
                else if (item.type === 'naver') navigate(`/feature/detail/folder/${item.data.folder_id}`);
                else if (item.type === 'youtube') navigate(`/feature/detail/youtube/${item.data.channel_id}`);
              }}
            />
          ))}
        </div>
      </section>
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
    return (
      <div className="px-4 pb-32">
        <GridSkeleton />
      </div>
    );
  }

  if (!subscriptions || subscriptions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 px-8 text-center">
        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-rose-100 to-amber-100 dark:from-surface-800 dark:to-surface-700 flex items-center justify-center mb-6">
          <Sparkles className="size-10 text-rose-300" />
        </div>
        <h3 className="text-xl font-bold text-surface-900 dark:text-white mb-2">
          구독을 시작해보세요
        </h3>
        <p className="text-sm text-surface-500 mb-8 leading-relaxed">
          마음에 드는 맛집 폴더를 구독하고<br/>새로운 맛집 소식을 받아보세요
        </p>
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

/**
 * Hero 카드 - 메인 피처드
 */
function HeroCard({ folder, onClick }: { folder: any; onClick: () => void }) {
  const images = getImages(folder, 3);
  const mainImage = images[0];

  return (
    <div onClick={onClick} className="relative rounded-[28px] overflow-hidden cursor-pointer group">
      {/* Main Image */}
      <div className="aspect-[4/5] relative">
        {mainImage ? (
          <img
            src={convertToNaverResizeImageUrl(mainImage)}
            alt={folder.title}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-rose-200 via-fuchsia-200 to-amber-200" />
        )}

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />

        {/* Content */}
        <div className="absolute inset-x-0 bottom-0 p-6">
          {/* Badge */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/20 backdrop-blur-sm mb-4">
            <Flame className="size-3 text-rose-400" />
            <span className="text-[11px] font-semibold text-white uppercase tracking-wider">추천</span>
          </div>

          {/* Title */}
          <h2 className="text-[28px] font-black text-white leading-tight mb-2 tracking-tight">
            {folder.title}
          </h2>
          
          {folder.description && (
            <p className="text-white/70 text-sm line-clamp-2 mb-4">{folder.description}</p>
          )}

          {/* Owner & Stats */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full overflow-hidden bg-white/20">
                {folder.owner_avatar_url ? (
                  <img src={getAvatarUrl(folder.owner_avatar_url)} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <User className="size-4 text-white/60" />
                  </div>
                )}
              </div>
              <span className="text-white/90 text-sm font-medium">{folder.owner_nickname || '익명'}</span>
            </div>
            <div className="flex items-center gap-3 text-white/60 text-xs">
              <span>{folder.place_count} 장소</span>
              <span>·</span>
              <span>{folder.subscriber_count || 0} 구독</span>
            </div>
          </div>
        </div>
      </div>

      {/* Sub Images */}
      {images.length > 1 && (
        <div className="absolute top-4 right-4 flex flex-col gap-2">
          {images.slice(1, 3).map((img, i) => (
            <div key={i} className="w-14 h-14 rounded-xl overflow-hidden border-2 border-white/30 shadow-lg">
              <img src={convertToNaverResizeImageUrl(img)} alt="" className="w-full h-full object-cover" loading="lazy" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * 소스 카드 - 가로 스크롤용
 */
function SourceCard({
  rank,
  title,
  image,
  count,
  type,
  onClick,
}: {
  rank: number;
  title: string;
  image?: string;
  count: number;
  type: 'naver' | 'youtube';
  onClick: () => void;
}) {
  return (
    <div onClick={onClick} className="flex-shrink-0 w-32 cursor-pointer group">
      <div className="relative aspect-[3/4] rounded-2xl overflow-hidden bg-surface-100 dark:bg-surface-800 mb-2">
        {image ? (
          <img
            src={convertToNaverResizeImageUrl(image)}
            alt={title}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-rose-100 to-amber-100 dark:from-surface-700 dark:to-surface-600 flex items-center justify-center">
            {type === 'youtube' ? <Youtube className="size-8 text-red-300" /> : <MapPin className="size-8 text-green-300" />}
          </div>
        )}

        {/* Rank */}
        <div className={cn(
          "absolute top-2 left-2 w-6 h-6 rounded-full flex items-center justify-center text-xs font-black",
          rank === 1 ? "bg-amber-400 text-amber-900" :
          rank === 2 ? "bg-surface-200 text-surface-600" :
          rank === 3 ? "bg-amber-600 text-white" :
          "bg-black/40 text-white"
        )}>
          {rank}
        </div>

        {/* Type Badge */}
        <div className={cn(
          "absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center",
          type === 'youtube' ? "bg-red-500" : "bg-green-500"
        )}>
          {type === 'youtube' ? <Play className="size-2.5 text-white fill-white" /> : <MapPin className="size-2.5 text-white" />}
        </div>

        {/* Gradient */}
        <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/60 to-transparent" />

        {/* Count */}
        <div className="absolute bottom-2 left-2 right-2">
          <span className="text-white/80 text-[10px] font-medium">{count}개 장소</span>
        </div>
      </div>
      <h4 className="text-xs font-semibold text-surface-900 dark:text-white line-clamp-2 leading-tight">{title}</h4>
    </div>
  );
}

/**
 * 컬렉션 카드 - Masonry Grid용
 */
function CollectionCard({
  item,
  index,
  onClick,
}: {
  item: any;
  index: number;
  onClick: () => void;
}) {
  const data = item.data;
  const images = item.type === 'place' ? [data.thumbnail] : getImages(data, 4);
  const mainImage = images[0] || (item.type === 'youtube' ? data.channel_thumbnail : item.type === 'naver' ? data.folder_thumbnail : undefined);
  const isTall = index % 5 === 0;

  const title = data.title || data.name || data.channel_title;
  const description = item.type === 'place' ? data.category : (data.description || data.memo);
  const placeCount = data.place_count;
  const ownerName = item.type === 'naver' ? '플레이스' : data.owner_nickname;
  const ownerAvatar = data.owner_avatar_url;

  return (
    <div
      onClick={onClick}
      className={cn(
        "break-inside-avoid mb-3 rounded-2xl overflow-hidden cursor-pointer group shadow-sm border transition-all duration-300",
        item.type === 'naver' 
          ? "bg-green-50/50 dark:bg-green-950/20 border-green-100 dark:border-green-900/30 hover:border-green-200 dark:hover:border-green-800" 
          : "bg-white dark:bg-surface-900 border-surface-100/50 dark:border-surface-800"
      )}
    >
      {/* Image */}
      {item.type !== 'place' && images.length > 0 ? (
        <div className={cn(
          "grid gap-px bg-surface-200 dark:bg-surface-800",
          images.length === 1 ? "grid-cols-1" : 
          images.length === 2 ? "grid-cols-2" : 
          images.length === 3 ? "grid-cols-2" : "grid-cols-2"
        )}>
          {images.map((img, i) => (
            <div 
              key={i} 
              className={cn(
                "overflow-hidden bg-surface-100 dark:bg-surface-800",
                images.length === 1 ? "aspect-[4/3]" : 
                images.length === 2 ? "aspect-square" :
                images.length === 3 && i === 0 ? "col-span-2 aspect-[2/1]" : "aspect-square"
              )}
            >
              <img src={convertToNaverResizeImageUrl(img)} alt="" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />
            </div>
          ))}
        </div>
      ) : mainImage ? (
        <div className={cn("relative overflow-hidden", isTall ? "aspect-[3/4]" : "aspect-square")}>
          <img
            src={convertToNaverResizeImageUrl(mainImage)}
            alt={title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            loading="lazy"
          />
          {/* Overlay for Place */}
          {item.type === 'place' && (
            <div className="absolute top-3 right-3">
              <div className="px-2 py-1 rounded-full bg-black/50 backdrop-blur-md border border-white/10 flex items-center gap-1">
                <Flame className="size-3 text-rose-400" />
                <span className="text-[10px] font-bold text-white">{data.popularity_score}</span>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className={cn(
          "flex items-center justify-center bg-gradient-to-br",
          item.type === 'youtube' ? "from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20" :
          item.type === 'naver' ? "from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20" :
          item.type === 'place' ? "from-rose-50 to-amber-50 dark:from-surface-800 dark:to-surface-700" :
          "from-rose-50 to-amber-50 dark:from-surface-800 dark:to-surface-700",
          isTall ? "aspect-[3/4]" : "aspect-square"
        )}>
          {item.type === 'youtube' && <Youtube className="size-10 text-red-300" />}
          {item.type === 'naver' && <MapPin className="size-10 text-green-300" />}
          {item.type === 'place' && <MapPin className="size-10 text-rose-300" />}
          {item.type === 'folder' && <Heart className="size-10 text-rose-300" />}
        </div>
      )}

      {/* Content */}
      <div className="p-3">
        {/* Type Badge */}
        <div className="mb-2">
          {item.type === 'youtube' && (
            <span className="text-[9px] px-2 py-1 rounded-full bg-red-50 dark:bg-red-900/30 text-red-500 font-semibold uppercase tracking-wider">유튜브</span>
          )}
          {item.type === 'naver' && (
            <span className="text-[9px] px-2 py-1 rounded-full bg-green-100 dark:bg-green-900/50 text-green-600 dark:text-green-400 font-bold uppercase tracking-wider border border-green-200/50 dark:border-green-800/50">네이버</span>
          )}
          {item.type === 'place' && (
            <span className="text-[9px] px-2 py-1 rounded-full bg-rose-50 dark:bg-rose-900/30 text-rose-500 font-semibold uppercase tracking-wider">인기</span>
          )}
          {item.type === 'folder' && (
            <span className="text-[9px] px-2 py-1 rounded-full bg-surface-100 dark:bg-surface-800 text-surface-500 font-semibold uppercase tracking-wider">컬렉션</span>
          )}
        </div>

        {/* Title */}
        <h3 className="text-sm font-bold text-surface-900 dark:text-white line-clamp-2 leading-snug mb-1">
          {title}
        </h3>

        {description && (
          <p className="text-[11px] text-surface-400 line-clamp-1 mb-2">{description}</p>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-1">
          {ownerName ? (
            <div className="flex items-center gap-1.5">
              <div className={cn(
                "w-5 h-5 rounded-full overflow-hidden flex items-center justify-center",
                item.type === 'naver' ? "bg-green-100 dark:bg-green-900/50" : "bg-surface-100 dark:bg-surface-800"
              )}>
                {item.type === 'naver' ? (
                  <MapPin className="size-3 text-green-500" />
                ) : ownerAvatar ? (
                  <img src={getAvatarUrl(ownerAvatar)} alt="" className="w-full h-full object-cover" />
                ) : (
                  <User className="size-2.5 text-surface-400" />
                )}
              </div>
              <span className="text-[10px] text-surface-500 font-medium">{ownerName}</span>
            </div>
          ) : (
            <span />
          )}
          {placeCount && (
            <span className="text-[10px] text-surface-400 font-medium">{placeCount}개</span>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Grid Skeleton
 */
function GridSkeleton() {
  return (
    <div className="columns-2 gap-3">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="break-inside-avoid mb-3 animate-pulse">
          <Skeleton className={cn("rounded-2xl w-full", i % 5 === 0 ? "aspect-[3/4]" : "aspect-square")} />
          <div className="p-3 space-y-2">
            <Skeleton className="h-3 w-16 rounded-full" />
            <Skeleton className="h-4 w-full rounded" />
            <Skeleton className="h-3 w-2/3 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}
