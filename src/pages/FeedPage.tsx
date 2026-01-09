import { useRef, useEffect } from "react";
import { useNavigate } from "react-router";
import { useMyFeed } from "@/entities/folder/queries";
import { usePlacePopup } from "@/shared/lib/place-popup";
import { PlaceSliderCard } from "@/shared/ui";
import { Loader2, Bell, Settings, Info } from "lucide-react";
import { useUserStore } from "@/entities/user";
import { useAuthModalStore } from "@/features/auth/model/useAuthModalStore";
import { cn, formatKoreanDate } from "@/shared/lib/utils";

export function FeedPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useUserStore();
  const { openLogin } = useAuthModalStore();
  const { show: showPlaceModal } = usePlacePopup();
  
  const { 
    data, 
    fetchNextPage, 
    hasNextPage, 
    isFetchingNextPage, 
    isLoading 
  } = useMyFeed();

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

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100dvh-56px)] p-6 text-center gap-6 bg-white dark:bg-surface-950">
        <div className="p-6 rounded-full bg-surface-50 dark:bg-surface-900">
          <Bell className="size-12 text-surface-200" />
        </div>
        <div>
          <h2 className="text-2xl font-black text-surface-900 dark:text-white">나만의 소식을 확인하세요</h2>
          <p className="text-surface-500 mt-2">구독한 폴더와 채널의 새로운 맛집 소식을<br />피드에서 받아볼 수 있습니다.</p>
        </div>
        <button 
          onClick={openLogin}
          className="w-full max-w-xs h-14 rounded-2xl bg-primary-500 text-white font-black text-lg shadow-soft-lg active:scale-95 transition-all"
        >
          로그인하고 시작하기
        </button>
      </div>
    );
  }

  const feedItems = data?.pages.flatMap(page => page) || [];

  return (
    <div 
      className="flex flex-col min-h-screen bg-white dark:bg-surface-950"
      style={{ 
        willChange: 'scroll-position',
        WebkitOverflowScrolling: 'touch',
      }}
    >
      {/* 상단 헤더 - 타이포 중심 */}
      <div className="bg-white dark:bg-surface-950 px-5 pt-8 pb-4 z-10 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <h1 className="text-2xl font-black text-surface-900 dark:text-white relative">
              피드
              <div className="absolute -bottom-2 left-0 right-0 h-1 bg-surface-900 dark:bg-white rounded-full" />
            </h1>
          </div>
          <button className="p-2 text-surface-400">
            <Settings className="size-5" />
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="size-8 animate-spin text-surface-300" />
        </div>
      ) : feedItems.length > 0 ? (
        <div className="flex-1 flex flex-col pb-20">
          {feedItems.map((item: any, idx: number) => {
            const getSourcePath = () => {
              switch (item.source_type) {
                case 'folder': return `/folder/${item.source_id}`;
                case 'naver_folder': return `/feature/detail/folder/${item.source_id}`;
                case 'youtube_channel': return `/feature/detail/youtube/${item.source_id}`;
                case 'community_region': return `/feature/detail/community/${item.source_id}`;
                default: return null;
              }
            };

            const sourcePath = getSourcePath();
            const sourceLabel = item.source_type === 'folder' ? '맛탐정 폴더' : 
                               item.source_type === 'naver_folder' ? '플레이스 폴더' :
                               item.source_type === 'youtube_channel' ? '유튜브' : '커뮤니티';

            return (
              <div key={`${item.source_id}-${item.place_id}-${idx}`} className="flex flex-col gap-3 py-6 px-5 border-b border-surface-50 dark:border-surface-900 last:border-0">
                {/* 정보 헤더 */}
                <div className="flex items-center justify-between">
                  <div 
                    className={cn(
                      "flex flex-col cursor-pointer group",
                      !sourcePath && "cursor-default"
                    )}
                    onClick={() => sourcePath && navigate(sourcePath)}
                  >
                    <span className="text-[10px] font-bold text-primary-500 uppercase tracking-widest mb-0.5">
                      {sourceLabel}
                    </span>
                    <h3 className="text-sm font-bold text-surface-900 dark:text-white group-hover:underline underline-offset-2">
                      {item.source_title}
                    </h3>
                  </div>
                  <span className="text-[10px] font-medium text-surface-400">
                    {formatKoreanDate(item.added_at)}
                  </span>
                </div>

                {/* 장소 카드 (현대적인 SNS 스타일) */}
                <div 
                  className="group relative flex flex-col bg-surface-50 dark:bg-surface-900/40 rounded-3xl overflow-hidden cursor-pointer border border-transparent active:bg-surface-100 dark:active:bg-surface-900 transition-colors duration-200"
                  onClick={() => showPlaceModal(item.place_id)}
                >
                  <div className="aspect-[16/9] w-full bg-surface-200 overflow-hidden">
                    {item.place_data.image_urls?.[0] ? (
                      <img 
                        src={item.place_data.image_urls[0]} 
                        alt={item.place_data.name} 
                        loading="lazy"
                        decoding="async"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-surface-400">
                        <Info className="size-8 opacity-20" />
                      </div>
                    )}
                  </div>
                  
                  <div className="p-4 flex flex-col gap-1">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-black text-lg text-surface-900 dark:text-white leading-tight">
                        {item.place_data.name}
                      </h4>
                      <span className="px-2 py-0.5 rounded-full bg-white dark:bg-surface-800 text-[10px] font-bold text-surface-500 dark:text-surface-400 border border-surface-100 dark:border-surface-700 whitespace-nowrap">
                        {item.place_data.category}
                      </span>
                    </div>
                    <p className="text-xs text-surface-500 line-clamp-1 italic">
                      {item.place_data.address}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
          
          {hasNextPage && (
            <div ref={observerTarget} className="py-12 flex justify-center">
              <Loader2 className="size-6 text-surface-300 animate-spin" />
            </div>
          )}
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center p-10 text-center gap-4">
          <div className="p-6 rounded-full bg-surface-50 dark:bg-surface-900">
            <Bell className="size-10 text-surface-200" />
          </div>
          <div>
            <p className="text-lg font-bold text-surface-900 dark:text-white">아직 새로운 소식이 없습니다</p>
            <p className="text-sm text-surface-500 mt-1">맛탐정 탭에서 관심 있는 폴더를 구독해보세요!</p>
          </div>
          <button 
            onClick={() => navigate("/feature/detective")}
            className="mt-2 px-6 py-3 rounded-xl bg-surface-900 text-white dark:bg-white dark:text-black font-bold text-sm"
          >
            맛탐정 보러가기
          </button>
        </div>
      )}
      
      {/* 바텀 내비게이션 여백 */}
      <div className="h-14" />
    </div>
  );
}
