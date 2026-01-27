import { Play } from "lucide-react";
import { Skeleton } from "@/shared/ui";

/**
 * 사각형 스토리 컴포넌트 (사용자/유튜브 채널용)
 */
export function StoryBox({
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

export function StoriesSection({ 
  isLoading, 
  children 
}: { 
  isLoading: boolean; 
  children: React.ReactNode 
}) {
  return (
    <section className="py-4 px-4">
      <div className="flex gap-3 overflow-x-auto no-scrollbar" style={{ WebkitOverflowScrolling: 'touch' }}>
        {isLoading ? (
          [...Array(6)].map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-2 flex-shrink-0">
              <Skeleton className="w-16 h-16 rounded-xl" />
              <Skeleton className="w-12 h-3 rounded" />
            </div>
          ))
        ) : (
          children
        )}
      </div>
    </section>
  );
}
