import { Trash2 } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import { ago } from "@/shared/lib/date";
import type { Feature } from "@/entities/place/types";

interface FeatureCardProps {
  /** 특징 데이터 */
  feature: Feature;
  /** 플랫폼 타입별 이름 변환기 */
  getPlatformName?: (domain: string) => string;
  /** 삭제 권한 여부 */
  isOwner?: boolean;
  /** 삭제 핸들러 */
  onDelete?: (e: React.MouseEvent) => void;
}

/**
 * 관련 콘텐츠(유튜브/커뮤니티) 카드 컴포넌트
 */
export function FeatureCard({ feature, getPlatformName, isOwner, onDelete }: FeatureCardProps) {
  const { platform_type, content_url, title, metadata } = feature;

  if (platform_type === "youtube") {
    return (
      <div className="relative group w-full">
        <a
          href={content_url}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-3 p-2 bg-white dark:bg-surface-900 rounded-xl hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors"
        >
          <div className="w-20 aspect-video rounded-lg overflow-hidden flex-shrink-0 bg-surface-100">
            <img
              src={metadata?.thumbnails?.default?.url || metadata?.thumbnails?.medium?.url}
              className="w-full h-full object-cover"
              loading="lazy"
              decoding="async"
              alt={title}
            />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-[13px] font-medium line-clamp-1 dark:text-surface-100">
              {title}
            </h4>
            <p className="text-[11px] text-surface-400 mt-0.5">
              {metadata?.channelTitle}
              {feature.created_at && (
                <>
                  <span className="mx-1 text-surface-300">·</span>
                  {ago(feature.created_at)}
                </>
              )}
            </p>
          </div>
        </a>
        {isOwner && onDelete && (
          <button
            onClick={onDelete}
            className="absolute top-1/2 -right-1 -translate-y-1/2 p-2 text-surface-300 hover:text-rose-500 transition-all"
          >
            <Trash2 className="size-4" />
          </button>
        )}
      </div>
    );
  }

  // community type
  return (
    <div className="relative group w-full">
      <a
        href={content_url}
        target="_blank"
        rel="noreferrer"
        className="flex items-center justify-between p-2.5 bg-white dark:bg-surface-900 rounded-xl hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors"
      >
        <div className="flex-1 min-w-0">
          <h4 className="text-[13px] font-medium truncate dark:text-surface-100">
            {title}
          </h4>
          <div className="flex items-center gap-1 mt-0.5">
            <span className="text-[10px] text-blue-500 font-medium">
              {getPlatformName ? getPlatformName(metadata?.domain) : metadata?.domain}
            </span>
            {feature.created_at && (
              <>
                <span className="text-surface-300 text-[10px]">·</span>
                <span className="text-[10px] text-surface-400">
                  {ago(feature.created_at)}
                </span>
              </>
            )}
          </div>
        </div>
      </a>
      {isOwner && onDelete && (
        <button
          onClick={onDelete}
          className="absolute top-1/2 -right-1 -translate-y-1/2 p-2 text-surface-300 hover:text-rose-500 transition-all"
        >
          <Trash2 className="size-4" />
        </button>
      )}
    </div>
  );
}
