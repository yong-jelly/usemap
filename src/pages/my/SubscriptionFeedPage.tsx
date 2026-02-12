import { useEffect } from "react";
import { useIntersection } from "@/shared/lib/use-intersection";
import { useMyFeed } from "@/entities/folder/queries";
import { Loader2 } from "lucide-react";
import { useUserStore } from "@/entities/user";
import { useNavigate } from "react-router";
import { cn, getAvatarUrl, formatKoreanDate } from "@/shared/lib/utils";
import { convertToNaverResizeImageUrl } from "@/shared/lib/naver";
import { usePlacePopup } from "@/shared/lib/place-popup";
import { MainHeader } from "@/widgets";

export function SubscriptionFeedPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useUserStore();
  const { show: showPlaceModal } = usePlacePopup();
  const { 
    data, 
    fetchNextPage, 
    hasNextPage, 
    isFetchingNextPage, 
    isLoading 
  } = useMyFeed({ sortBy: 'recent' }, { enabled: isAuthenticated });

  const { ref, inView } = useIntersection({ rootMargin: "100px" });

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/auth/login");
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  const allItems = data?.pages.flat() || [];

  const handleSourceClick = (e: React.MouseEvent, item: any) => {
    e.stopPropagation();
    if (item.source_type === 'folder') {
      navigate(`/folder/${item.source_id}`);
    } else if (item.source_type === 'naver_folder') {
      navigate(`/feature/detail/folder/${item.source_id}`);
    } else if (item.source_type === 'youtube_channel') {
      navigate(`/feature/detail/youtube/${item.source_id}`);
    } else if (item.source_type === 'community_region') {
      navigate(`/feature/detail/community/${item.source_id}`);
    }
  };

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate("/home");
    }
  };

  return (
    <div className="flex flex-col min-h-dvh bg-white dark:bg-surface-950">
      {/* 상단 헤더 */}
      <MainHeader 
        tabs={[]} 
        activeTab="" 
        title="구독"
      />

      {/* 컨텐츠 영역 */}
      <main className="flex-1 w-full max-w-lg mx-auto pt-16 pb-10 bg-white dark:bg-surface-950 min-h-dvh">
        <div className="px-4">
          {isLoading ? (
            <div className="flex justify-center p-12">
              <Loader2 className="size-8 text-surface-300 animate-spin" />
            </div>
          ) : allItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 text-center text-surface-500">
              <p>구독 중인 폴더나 채널이 없습니다.</p>
              <p className="text-sm mt-2">마음에 드는 폴더를 구독해보세요!</p>
            </div>
          ) : (
            <div className="columns-2 gap-3 space-y-3">
              {allItems.map((item: any, index: number) => {
                const place = item.place_data;
                const images = place.images || place.image_urls || (place.thumbnail ? [place.thumbnail] : []);
                const mainImage = images[0];
                const isTall = index % 5 === 0;

                return (
                  <div 
                    key={`${item.source_type}-${item.source_id}-${item.place_id}`} 
                    className="break-inside-avoid rounded-xl overflow-hidden cursor-pointer bg-white dark:bg-surface-900 border border-surface-100 dark:border-surface-800 transition-all mb-3"
                    onClick={() => showPlaceModal(item.place_id)}
                  >
                    {/* 이미지 영역 */}
                    <div className={cn("relative overflow-hidden bg-surface-100 dark:bg-surface-800", isTall ? "aspect-[3/4]" : "aspect-square")}>
                      {mainImage ? (
                        <img 
                          src={convertToNaverResizeImageUrl(mainImage)} 
                          alt={place.name} 
                          className="w-full h-full object-cover" 
                          loading="lazy" 
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-surface-300 text-xs">
                          NO IMAGE
                        </div>
                      )}
                      {/* 평점 배지 */}
                      {place.visitor_reviews_score && (
                        <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded bg-black/40 backdrop-blur-sm">
                          <span className="text-[10px] font-medium text-white">★ {place.visitor_reviews_score}</span>
                        </div>
                      )}
                    </div>

                    {/* 컨텐츠 영역 */}
                    <div className="p-3">
                      <div className="mb-1.5 flex items-center justify-between">
                        <div className="flex gap-1.5">
                          <span className="text-[9px] text-primary-600 dark:text-primary-400 font-medium uppercase tracking-wider">
                            {item.source_type === 'youtube_channel' ? 'YOUTUBE' : 
                             item.source_type === 'naver_folder' ? 'NAVER' : 
                             item.source_type === 'folder' ? 'FOLDER' : 'PICK'}
                          </span>
                        </div>
                      </div>
                      
                      <h3 className="text-sm font-medium text-surface-900 dark:text-white line-clamp-1 leading-snug mb-1">
                        {place.name}
                      </h3>
                      
                      <p className="text-[11px] text-surface-400 line-clamp-1 mb-2">
                        {place.category || place.category_name} · {place.group2}
                      </p>

                      {/* 코멘트 강조 박스 */}
                      {item.comment && (
                        <div className="mb-3 p-2.5 rounded-lg bg-surface-50 dark:bg-surface-800/50 border border-surface-100 dark:border-surface-800">
                          <p className="text-[11px] text-surface-600 dark:text-surface-300 line-clamp-3 leading-relaxed">
                            {item.comment}
                          </p>
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-2 border-t border-surface-50 dark:border-surface-800">
                        <div 
                          className="flex items-center gap-1.5 cursor-pointer hover:opacity-70 transition-opacity"
                          onClick={(e) => handleSourceClick(e, item)}
                        >
                          <div className="w-4 h-4 rounded-full overflow-hidden bg-surface-100 dark:bg-surface-800 border border-surface-100 dark:border-surface-700">
                            {item.source_image ? (
                              <img src={getAvatarUrl(item.source_image)} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full bg-surface-200" />
                            )}
                          </div>
                          <span className="text-[10px] text-surface-500 font-medium truncate max-w-[80px]">
                            {item.source_title}
                          </span>
                        </div>
                        <span className="text-[9px] text-surface-300">
                          {formatKoreanDate(item.added_at)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Infinite Scroll Trigger */}
          <div ref={ref} className="h-10 flex justify-center items-center">
            {isFetchingNextPage && (
              <Loader2 className="size-6 text-surface-300 animate-spin" />
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
