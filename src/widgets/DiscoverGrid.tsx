import { useNavigate } from "react-router";
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
  const memo = data.memo || data.user_note || data.comment;
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
      "break-inside-avoid mb-4 rounded-xl overflow-hidden cursor-pointer bg-white dark:bg-surface-900 border border-surface-100 dark:border-surface-800 transition-all",
    )}>
      <div onClick={handleImageClick}>
        {item.type !== 'place' && images.length >= 4 ? (
          <div className="grid grid-cols-2 gap-px bg-surface-100 dark:bg-surface-800">
            {images.slice(0, 4).map((img, i) => (
              <div key={i} className="aspect-square overflow-hidden">
                <img src={convertToNaverResizeImageUrl(img)} alt="" className="w-full h-full object-cover" loading="lazy" />
              </div>
            ))}
          </div>
        ) : mainImage ? (
          <div className={cn("relative overflow-hidden", data.aspect || (isTall ? "aspect-[3/4]" : "aspect-square"))}>
            <img src={convertToNaverResizeImageUrl(mainImage)} alt={title} className="w-full h-full object-cover" loading="lazy" />
            {item.type === 'place' && data.popularity_score && (
              <div className="absolute top-3 right-3">
                <div className="px-2 py-1 rounded bg-black/40 backdrop-blur-sm">
                  <span className="text-[10px] font-medium text-white">{data.popularity_score}</span>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className={cn(
            "flex items-center justify-center bg-surface-50 dark:bg-surface-800",
            isTall ? "aspect-[3/4]" : "aspect-square"
          )}>
            <span className="text-xs text-surface-400 font-medium uppercase tracking-widest">{item.type}</span>
          </div>
        )}
      </div>

      <div className="p-4" onClick={onClick}>
        <div className="mb-2 flex items-center justify-between">
          <div className="flex gap-1.5">
            {item.type === 'youtube' && <span className="text-[9px] text-primary-600 dark:text-primary-400 font-medium uppercase tracking-wider">YOUTUBE</span>}
            {item.type === 'naver' && <span className="text-[9px] text-primary-600 dark:text-primary-400 font-medium uppercase tracking-wider">NAVER</span>}
            {item.type === 'place' && <span className="text-[9px] text-primary-600 dark:text-primary-400 font-medium uppercase tracking-wider">HOT</span>}
            {item.type === 'folder' && <span className="text-[9px] text-surface-400 font-medium uppercase tracking-wider">COLLECTION</span>}
          </div>
          {data.distance_meters && (
            <span className="text-[10px] text-primary-600 font-medium">{Math.round(data.distance_meters)}m</span>
          )}
        </div>
        
        <h3 className="text-sm font-medium text-surface-900 dark:text-white line-clamp-2 leading-snug mb-2">
          {title}
        </h3>

        {/* 맥락 메모 강조 */}
        {memo ? (
          <div className="mb-3 p-3 rounded-lg bg-surface-50 dark:bg-surface-800/50 border border-surface-100 dark:border-surface-800">
            <p className="text-[11px] text-surface-600 dark:text-surface-300 line-clamp-3 leading-relaxed">
              {memo}
            </p>
          </div>
        ) : description && (
          <p className="text-[11px] text-surface-400 line-clamp-1 mb-3">{description}</p>
        )}

        <div className="flex items-center justify-between pt-3 border-t border-surface-50 dark:border-surface-800">
          {ownerName && (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full overflow-hidden bg-surface-100 dark:bg-surface-800">
                {ownerAvatar ? <img src={getAvatarUrl(ownerAvatar)} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full" />}
              </div>
              <span className="text-[10px] text-surface-500 font-medium truncate max-w-[80px]">{ownerName}</span>
            </div>
          )}
          {placeCount && <span className="text-[10px] text-surface-400 font-medium">{placeCount} Places</span>}
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
