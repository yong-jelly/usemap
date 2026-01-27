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
      {/* Header - 미니멀하고 엣지있는 타이포 */}
      <header className="sticky top-0 z-40 bg-[#FAFAF9]/95 dark:bg-surface-950/95">
        <div className="px-5 pt-8 pb-4">
          <div className="flex items-end justify-between mb-6">
            <div>
              <p className="text-[11px] uppercase tracking-[0.2em] text-rose-400 font-medium mb-1">Discover</p>
              <h1 className="text-[32px] font-black text-surface-900 dark:text-white leading-none tracking-tight">
                맛탐정
              </h1>
            </div>
            <button 
              onClick={handleCreateFolder}
              className="w-11 h-11 rounded-full bg-surface-900 dark:bg-white flex items-center justify-center"
            >
              <Plus className="size-5 text-white dark:text-surface-900" strokeWidth={2.5} />
            </button>
          </div>
          
          {/* Tab Pills */}
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab("foryou")}
              className={cn(
                "px-5 py-2.5 rounded-full text-sm font-semibold transition-all",
                activeTab === "foryou"
                  ? "bg-surface-900 text-white dark:bg-white dark:text-surface-900"
                  : "bg-white dark:bg-surface-800 text-surface-500 dark:text-surface-400 border border-surface-200 dark:border-surface-700"
              )}
            >
              For You
            </button>
            <button
              onClick={() => setActiveTab("following")}
              className={cn(
                "px-5 py-2.5 rounded-full text-sm font-semibold transition-all",
                activeTab === "following"
                  ? "bg-surface-900 text-white dark:bg-white dark:text-surface-900"
                  : "bg-white dark:bg-surface-800 text-surface-500 dark:text-surface-400 border border-surface-200 dark:border-surface-700"
              )}
            >
              Following
            </button>
          </div>
        </div>
      </header>

      {/* Stories - 깔끔한 원형 스토리 */}
      <section className="py-4 px-4">
        <div className="flex gap-4 overflow-x-auto no-scrollbar" style={{ WebkitOverflowScrolling: 'touch' }}>
          {isMyFoldersLoading ? (
            [...Array(4)].map((_, i) => (
              <div key={i} className="flex flex-col items-center gap-2 flex-shrink-0">
                <Skeleton className="w-16 h-16 rounded-full" />
                <Skeleton className="w-12 h-3 rounded" />
              </div>
            ))
          ) : (
            <>
              {myFolders?.slice(0, 5).map((folder, i) => (
                <StoryCircle
                  key={folder.id}
                  image={getFirstImage(folder)}
                  label={folder.title}
                  onClick={() => navigate(`/folder/${folder.id}`)}
                  isFirst={i === 0}
                />
              ))}
              {subscriptions?.slice(0, 3).map((sub: any) => (
                <StoryCircle
                  key={`${sub.subscription_type}-${sub.feature_id}`}
                  image={sub.subscription_type === 'naver_folder' ? naverIcon : sub.thumbnail}
                  label={sub.title}
                  onClick={() => {
                    if (sub.subscription_type === 'folder') navigate(`/folder/${sub.feature_id}`);
                    else if (sub.subscription_type === 'naver_folder') navigate(`/feature/detail/folder/${sub.feature_id}`);
                    else if (sub.subscription_type === 'youtube_channel') navigate(`/feature/detail/youtube/${sub.feature_id}`);
                  }}
                  badge={sub.subscription_type === 'youtube_channel' ? 'youtube' : sub.subscription_type === 'naver_folder' ? 'naver' : undefined}
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
        />
      )}
    </div>
  );
}

/**
 * 원형 스토리 컴포넌트
 */
function StoryCircle({
  image,
  label,
  onClick,
  isFirst,
  badge,
}: {
  image?: string;
  label: string;
  onClick: () => void;
  isFirst?: boolean;
  badge?: 'youtube' | 'naver';
}) {
  return (
    <button onClick={onClick} className="flex flex-col items-center gap-2 flex-shrink-0 group">
      <div className={cn(
        "relative w-16 h-16 rounded-full p-0.5",
        isFirst ? "bg-gradient-to-tr from-rose-400 via-fuchsia-500 to-amber-400" : "bg-surface-200 dark:bg-surface-700"
      )}>
        <div className="w-full h-full rounded-full overflow-hidden bg-[#FAFAF9] dark:bg-surface-900 p-0.5">
          {image ? (
            <img
              src={convertToNaverResizeImageUrl(image)}
              alt={label}
              className="w-full h-full rounded-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full rounded-full bg-gradient-to-br from-rose-100 to-amber-100 dark:from-surface-800 dark:to-surface-700 flex items-center justify-center">
              <Heart className="size-5 text-rose-300" />
            </div>
          )}
        </div>
        {badge === 'youtube' && (
          <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full bg-red-500 border-2 border-[#FAFAF9] flex items-center justify-center">
            <Play className="size-2 text-white fill-white" />
          </div>
        )}
        {badge === 'naver' && (
          <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full bg-green-500 border-2 border-[#FAFAF9] flex items-center justify-center">
            <MapPin className="size-2 text-white" />
          </div>
        )}
      </div>
      <span className="text-[11px] text-surface-600 dark:text-surface-400 font-medium truncate max-w-16">{label}</span>
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

    discoverData?.naverFolders?.forEach((folder: any, i: number) => {
      items.push({ type: 'naver', data: folder, size: i % 4 === 0 ? 'large' : 'normal' });
    });

    discoverData?.youtubeChannels?.forEach((channel: any, i: number) => {
      items.push({ type: 'youtube', data: channel, size: i % 3 === 0 ? 'large' : 'normal' });
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
            <h2 className="text-base font-bold text-surface-900 dark:text-white">인기 소스</h2>
          </div>
          <button onClick={() => navigate("/feature")} className="text-xs text-surface-400 flex items-center gap-0.5">
            더보기 <ChevronRight className="size-3" />
          </button>
        </div>

        <div className="flex gap-3 px-4 overflow-x-auto no-scrollbar" style={{ WebkitOverflowScrolling: 'touch' }}>
          {discoverData?.naverFolders?.slice(0, 4).map((folder: any, i: number) => (
            <SourceCard
              key={folder.folder_id}
              rank={i + 1}
              title={folder.name}
              image={getFirstImage(folder)}
              count={folder.place_count}
              type="naver"
              onClick={() => navigate(`/feature/detail/folder/${folder.folder_id}`)}
            />
          ))}
          {discoverData?.youtubeChannels?.slice(0, 4).map((channel: any, i: number) => (
            <SourceCard
              key={channel.channel_id}
              rank={i + 5}
              title={channel.channel_title}
              image={getFirstImage(channel)}
              count={channel.place_count}
              type="youtube"
              onClick={() => navigate(`/feature/detail/youtube/${channel.channel_id}`)}
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
}: {
  subscriptions: any[];
  isLoading: boolean;
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
            <span className="text-[11px] font-semibold text-white uppercase tracking-wider">Featured</span>
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
  const images = getImages(data, 4);
  const mainImage = images[0] || (item.type === 'youtube' ? data.channel_thumbnail : undefined);
  const isTall = index % 5 === 0;

  const title = data.title || data.name || data.channel_title;
  const description = data.description || data.memo;
  const placeCount = data.place_count;
  const ownerName = data.owner_nickname;
  const ownerAvatar = data.owner_avatar_url;

  return (
    <div
      onClick={onClick}
      className="break-inside-avoid mb-3 rounded-2xl overflow-hidden bg-white dark:bg-surface-900 cursor-pointer group shadow-sm border border-surface-100/50 dark:border-surface-800"
    >
      {/* Image */}
      {images.length >= 4 ? (
        <div className="grid grid-cols-2 gap-px bg-surface-200 dark:bg-surface-800">
          {images.slice(0, 4).map((img, i) => (
            <div key={i} className="aspect-square overflow-hidden">
              <img src={convertToNaverResizeImageUrl(img)} alt="" className="w-full h-full object-cover" loading="lazy" />
            </div>
          ))}
        </div>
      ) : mainImage ? (
        <div className={cn("overflow-hidden", isTall ? "aspect-[3/4]" : "aspect-square")}>
          <img
            src={convertToNaverResizeImageUrl(mainImage)}
            alt={title}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        </div>
      ) : (
        <div className={cn(
          "flex items-center justify-center bg-gradient-to-br",
          item.type === 'youtube' ? "from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20" :
          item.type === 'naver' ? "from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20" :
          "from-rose-50 to-amber-50 dark:from-surface-800 dark:to-surface-700",
          isTall ? "aspect-[3/4]" : "aspect-square"
        )}>
          {item.type === 'youtube' && <Youtube className="size-10 text-red-300" />}
          {item.type === 'naver' && <MapPin className="size-10 text-green-300" />}
          {item.type === 'folder' && <Heart className="size-10 text-rose-300" />}
        </div>
      )}

      {/* Content */}
      <div className="p-3">
        {/* Type Badge */}
        <div className="mb-2">
          {item.type === 'youtube' && (
            <span className="text-[9px] px-2 py-1 rounded-full bg-red-50 dark:bg-red-900/30 text-red-500 font-semibold uppercase tracking-wider">YouTube</span>
          )}
          {item.type === 'naver' && (
            <span className="text-[9px] px-2 py-1 rounded-full bg-green-50 dark:bg-green-900/30 text-green-500 font-semibold uppercase tracking-wider">Place</span>
          )}
          {item.type === 'folder' && (
            <span className="text-[9px] px-2 py-1 rounded-full bg-rose-50 dark:bg-rose-900/30 text-rose-500 font-semibold uppercase tracking-wider">Collection</span>
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
              <div className="w-5 h-5 rounded-full overflow-hidden bg-surface-100 dark:bg-surface-800">
                {ownerAvatar ? (
                  <img src={getAvatarUrl(ownerAvatar)} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <User className="size-2.5 text-surface-400" />
                  </div>
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
