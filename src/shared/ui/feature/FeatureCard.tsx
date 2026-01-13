import { Globe, ExternalLink } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import type { Feature } from "@/entities/place/types";

interface FeatureCardProps {
  /** 특징 데이터 */
  feature: Feature;
  /** 플랫폼 타입별 이름 변환기 */
  getPlatformName?: (domain: string) => string;
}

/**
 * 관련 콘텐츠(유튜브/커뮤니티) 카드 컴포넌트
 */
export function FeatureCard({ feature, getPlatformName }: FeatureCardProps) {
  const { platform_type, content_url, title, metadata } = feature;

  if (platform_type === "youtube") {
    return (
      <a
        href={content_url}
        target="_blank"
        rel="noreferrer"
        className="flex-shrink-0 w-64 bg-white dark:bg-surface-900 rounded-xl overflow-hidden border border-surface-100 dark:border-surface-800 shadow-sm"
      >
        <div className="aspect-video relative">
          <img
            src={metadata?.thumbnails?.medium?.url}
            className="w-full h-full object-cover"
            loading="lazy"
            decoding="async"
            alt={title}
          />
          <div className="absolute inset-0 flex items-center justify-center bg-black/10">
            <div className="size-10 bg-red-600 rounded-full flex items-center justify-center shadow-lg">
              <div className="w-0 h-0 border-l-[12px] border-l-white border-t-[7px] border-t-transparent border-b-[7px] border-b-transparent ml-1" />
            </div>
          </div>
        </div>
        <div className="p-3">
          <h4 className="text-[13px] font-bold line-clamp-1 dark:text-surface-100">
            {title}
          </h4>
          <p className="text-[11px] text-surface-400 mt-1">
            {metadata?.channelTitle}
          </p>
        </div>
      </a>
    );
  }

  // community type
  return (
    <a
      href={content_url}
      target="_blank"
      rel="noreferrer"
      className="flex-shrink-0 w-64 flex items-center gap-3 p-3 bg-white dark:bg-surface-900 rounded-xl border border-surface-100 dark:border-surface-800 shadow-sm"
    >
      <div className="size-10 bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 rounded-lg flex items-center justify-center shrink-0">
        <Globe className="size-5" />
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="text-[13px] font-bold truncate dark:text-surface-100">
          {title}
        </h4>
        <span className="text-[10px] text-blue-500 font-bold">
          {getPlatformName ? getPlatformName(metadata?.domain) : metadata?.domain}
        </span>
      </div>
      <ExternalLink className="size-4 text-surface-200" />
    </a>
  );
}
