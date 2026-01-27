import { useNavigate } from "react-router";
import { Youtube, MapPin, User, Flame, Heart } from "lucide-react";
import { cn, getAvatarUrl } from "@/shared/lib/utils";
import { convertToNaverResizeImageUrl } from "@/shared/lib/naver";
import { Skeleton } from "@/shared/ui";

// getImages 헬퍼 (내부용)
function getImages(item: any, count: number = 4): string[] {
  if (!item) return [];
  if (Array.isArray(item.images) && item.images.length > 0) {
    return [...item.images].sort(() => Math.random() - 0.5).slice(0, count);
  }
  const images: string[] = [];
  const places = item.preview_places || [];
  for (const place of places) {
    if (images.length >= count) break;
    const img = place.thumbnail || place.images?.[0] || place.image_urls?.[0] || place.place_images?.[0];
    if (img && !images.includes(img)) images.push(img);
  }
  return images;
}

export function CollectionCard({
  item,
  index,
  onClick,
  onPlaceClick,
}: {
  item: any;
  index: number;
  onClick: () => void;
  onPlaceClick: (id: string) => void;
}) {
  const data = item.data;
  const images = item.type === 'place' ? [data.thumbnail] : getImages(data, 4);
  const mainImage = images[0] || (item.type === 'youtube' ? data.channel_thumbnail : item.type === 'naver' ? data.folder_thumbnail : undefined);
  const isTall = index % 5 === 0;

  const title = data.title || data.name || data.channel_title;
  const description = item.type === 'place' ? data.category : (data.description || data.memo);
  const placeCount = data.place_count;
  const ownerName = item.type === 'naver' ? '플레이스' : (item.type === 'youtube' ? data.channel_title : data.owner_nickname);
  const ownerAvatar = item.type === 'youtube' ? data.channel_thumbnail : data.owner_avatar_url;

  const isSinglePlace = placeCount === 1 || item.type === 'place';
  const singlePlaceId = item.type === 'place' ? data.id : (data.preview_places?.[0]?.id || data.id);

  const handleImageClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isSinglePlace && singlePlaceId) {
      onPlaceClick(singlePlaceId);
    } else {
      onClick();
    }
  };

  return (
    <div className={cn(
      "break-inside-avoid mb-3 rounded-2xl overflow-hidden cursor-pointer group shadow-sm border transition-all duration-300",
      item.type === 'naver' ? "bg-green-50/50 dark:bg-green-950/20 border-green-100 dark:border-green-900/30 hover:border-green-300 dark:hover:border-green-700" 
      : item.type === 'youtube' ? "bg-red-50/50 dark:bg-red-950/20 border-red-100 dark:border-red-900/30 hover:border-red-300 dark:hover:border-red-700"
      : "bg-white dark:bg-surface-900 border-surface-100/50 dark:border-surface-800"
    )}>
      <div onClick={handleImageClick}>
        {item.type !== 'place' && images.length >= 4 ? (
          <div className="grid grid-cols-2 gap-px bg-surface-200 dark:bg-surface-800">
            {images.slice(0, 4).map((img, i) => (
              <div key={i} className="aspect-square overflow-hidden">
                <img src={convertToNaverResizeImageUrl(img)} alt="" className="w-full h-full object-cover" loading="lazy" />
              </div>
            ))}
          </div>
        ) : mainImage ? (
          <div className={cn("relative overflow-hidden", isTall ? "aspect-[3/4]" : "aspect-square")}>
            <img src={convertToNaverResizeImageUrl(mainImage)} alt={title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" loading="lazy" />
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
      </div>

      <div className="p-3" onClick={onClick}>
        <div className="mb-2">
          {item.type === 'youtube' && <span className="text-[9px] px-2 py-1 rounded-full bg-red-500 text-white font-medium uppercase tracking-wider shadow-sm">유튜브</span>}
          {item.type === 'naver' && <span className="text-[9px] px-2 py-1 rounded-full bg-green-500 text-white font-medium uppercase tracking-wider shadow-sm">네이버</span>}
          {item.type === 'place' && <span className="text-[9px] px-2 py-1 rounded-full bg-rose-50 dark:bg-rose-900/30 text-rose-500 font-semibold uppercase tracking-wider">인기</span>}
          {item.type === 'folder' && <span className="text-[9px] px-2 py-1 rounded-full bg-surface-100 dark:bg-surface-800 text-surface-500 font-semibold uppercase tracking-wider">컬렉션</span>}
        </div>
        <h3 className={cn("text-sm font-medium line-clamp-2 leading-snug mb-1", item.type === 'naver' ? "text-green-900 dark:text-green-50" : item.type === 'youtube' ? "text-red-900 dark:text-red-50" : "text-surface-900 dark:text-white")}>
          {title}
        </h3>
        {description && <p className={cn("text-[11px] line-clamp-1 mb-2", item.type === 'naver' ? "text-green-600/70" : item.type === 'youtube' ? "text-red-600/70" : "text-surface-400")}>{description}</p>}
        <div className="flex items-center justify-between pt-1">
          {ownerName ? (
            <div className="flex items-center gap-1.5">
              <div className={cn("w-5 h-5 rounded-full overflow-hidden flex items-center justify-center", item.type === 'naver' ? "bg-green-100 dark:bg-green-900/50" : item.type === 'youtube' ? "bg-red-100 dark:bg-red-900/50" : "bg-surface-100 dark:bg-surface-800")}>
                {item.type === 'naver' ? <MapPin className="size-3 text-green-600 dark:text-green-400" /> : item.type === 'youtube' ? <img src={ownerAvatar} alt="" className="w-full h-full object-cover" /> : ownerAvatar ? <img src={getAvatarUrl(ownerAvatar)} alt="" className="w-full h-full object-cover" /> : <User className="size-2.5 text-surface-400" />}
              </div>
              <span className={cn("text-[10px] font-medium", item.type === 'naver' ? "text-green-700 dark:text-green-400" : item.type === 'youtube' ? "text-red-700 dark:text-red-400" : "text-surface-500")}>{ownerName}</span>
            </div>
          ) : <span />}
          {placeCount && <span className={cn("text-[10px] font-medium", item.type === 'naver' ? "text-green-600/70 dark:text-green-500/70" : item.type === 'youtube' ? "text-red-600/70 dark:text-red-500/70" : "text-surface-400")}>{placeCount}개</span>}
        </div>
      </div>
    </div>
  );
}

export function DiscoverGrid({ items, onPlaceClick }: { items: any[], onPlaceClick: (id: string) => void }) {
  const navigate = useNavigate();
  return (
    <section className="px-4">
      <h2 className="text-base font-bold text-surface-900 dark:text-white mb-4">발견하기</h2>
      <div className="columns-2 gap-3">
        {items.map((item, index) => (
          <CollectionCard
            key={`${item.type}-${item.data.id || item.data.folder_id || item.data.channel_id}`}
            item={item}
            index={index}
            onPlaceClick={onPlaceClick}
            onClick={() => {
              if (item.type === 'folder') navigate(`/folder/${item.data.id}`);
              else if (item.type === 'place') onPlaceClick(item.data.id);
              else if (item.type === 'naver') navigate(`/feature/detail/folder/${item.data.id}`);
              else if (item.type === 'youtube') navigate(`/feature/detail/youtube/${item.data.channel_id}`);
            }}
          />
        ))}
      </div>
    </section>
  );
}

export function GridSkeleton() {
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
