import { useMemo } from "react";
import { Youtube, MessageCircle, MapPin, User, Bookmark } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import { convertToNaverResizeImageUrl } from "@/shared/lib";
import type { Feature } from "@/entities/place/types";
import naverIcon from "@/assets/images/naver-map-logo.png";

const DOMAIN_LABELS: Record<string, string> = {
  "clien.net": "클리앙",
  "damoang.net": "다모앙",
  "bobaedream.co.kr": "보배드림",
  "ppomppu.co.kr": "뽐뿌",
  "fmkorea.com": "에프엠코리아",
};

interface FeatureGroup {
  key: string;
  name: string;
  thumbnail_url: string | null;
  platform_type: string;
  representative: Feature;
}

interface PlaceIncludedCollectionsProps {
  features: Feature[];
  placeImages?: string[];
  className?: string;
  onFeatureClick?: (feature: Feature) => void;
}

/**
 * 장소가 포함된 콜렉션을 가로 스크롤 카드 형태로 표시.
 * collection.key 기준으로 중복 제거 후, 썸네일 + 콜렉션(채널) 이름만 표시.
 */
export function PlaceIncludedCollections({
  features,
  placeImages = [],
  className,
  onFeatureClick,
}: PlaceIncludedCollectionsProps) {
  const groups = useMemo(() => {
    const map = new Map<string, FeatureGroup>();

    for (const f of features) {
      const key = f.collection?.key || `${f.platform_type}-${f.id}`;
      if (map.has(key)) continue;

      const places = f.collection?.places || [];
      const thumbUrl = places[0]?.url || null;
      const fallbackThumb = placeImages[0] || null;

      let name = f.collection?.name || "";
      if (!name) {
        switch (f.platform_type) {
          case "youtube":
            name = f.metadata?.channelTitle || f.title || "YouTube";
            break;
          case "folder":
            name = f.title || f.metadata?.title || "플레이스";
            break;
          case "community":
            name = DOMAIN_LABELS[f.metadata?.domain] || f.metadata?.domain || "커뮤니티";
            break;
          case "public_user":
            name = f.title || "맛탐정";
            break;
          case "social":
            name = f.metadata?.service || "소셜";
            break;
          default:
            name = f.title || f.platform_type;
        }
      }

      if (f.platform_type === "community" && f.metadata?.domain && DOMAIN_LABELS[f.metadata.domain]) {
        name = DOMAIN_LABELS[f.metadata.domain];
      }

      map.set(key, {
        key,
        name,
        thumbnail_url: thumbUrl || (f.platform_type !== "youtube" ? fallbackThumb : null),
        platform_type: f.platform_type,
        representative: f,
      });
    }

    return Array.from(map.values());
  }, [features, placeImages]);

  if (groups.length === 0) return null;

  return (
    <div className={cn("mb-4", className)}>
      <span className="text-[13px] font-bold text-surface-500 dark:text-surface-400 uppercase tracking-wider">
        포함된 콜렉션
      </span>
      <div
        className="flex gap-3 mt-2 overflow-x-auto scrollbar-hide pb-1"
        style={{ WebkitOverflowScrolling: "touch" }}
      >
        {groups.map((group) => (
          <button
            key={group.key}
            onClick={() => onFeatureClick?.(group.representative)}
            className="flex flex-col items-center w-[88px] shrink-0 active:opacity-70"
          >
            <CollectionThumbnail
              url={group.thumbnail_url}
              platformType={group.platform_type}
              name={group.name}
            />
            <span className="w-full text-xs font-medium text-surface-700 dark:text-surface-300 truncate text-center mt-1.5">
              {group.name}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

function CollectionThumbnail({
  url,
  platformType,
  name,
}: {
  url: string | null;
  platformType: string;
  name: string;
}) {
  if (url) {
    return (
      <div className="w-[88px] aspect-square rounded-xl overflow-hidden bg-surface-100 dark:bg-surface-800 relative">
        <img
          src={convertToNaverResizeImageUrl(url)}
          alt={name}
          className="w-full h-full object-cover"
          loading="lazy"
          decoding="async"
        />
        <PlatformBadge type={platformType} />
      </div>
    );
  }

  return (
    <div className="w-[88px] aspect-square rounded-xl bg-surface-100 dark:bg-surface-800 flex items-center justify-center relative">
      <PlaceholderIcon type={platformType} />
      <PlatformBadge type={platformType} />
    </div>
  );
}

function PlatformBadge({ type }: { type: string }) {
  const config: Record<string, { bg: string; icon: React.ReactNode }> = {
    youtube: {
      bg: "bg-red-500",
      icon: <Youtube className="size-2.5 text-white fill-white" />,
    },
    folder: {
      bg: "bg-green-500",
      icon: <img src={naverIcon} alt="" className="size-3 rounded-sm" />,
    },
    community: {
      bg: "bg-blue-500",
      icon: <MessageCircle className="size-2.5 text-white" />,
    },
    public_user: {
      bg: "bg-violet-500",
      icon: <User className="size-2.5 text-white" />,
    },
    social: {
      bg: "bg-pink-500",
      icon: <Bookmark className="size-2.5 text-white" />,
    },
  };

  const c = config[type];
  if (!c) return null;

  return (
    <div className={cn("absolute top-1 right-1 size-5 rounded-full flex items-center justify-center", c.bg)}>
      {c.icon}
    </div>
  );
}

function PlaceholderIcon({ type }: { type: string }) {
  switch (type) {
    case "youtube":
      return <Youtube className="size-8 text-red-300" />;
    case "folder":
      return <MapPin className="size-8 text-green-300" />;
    case "community":
      return <MessageCircle className="size-8 text-blue-300" />;
    case "public_user":
      return <User className="size-8 text-violet-300" />;
    default:
      return <Bookmark className="size-8 text-surface-300" />;
  }
}
