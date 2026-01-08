import { useState } from "react";
import { useNaverFolders, useYoutubeChannels } from "@/entities/place/queries";
import { cn } from "@/shared/lib/utils";
import { convertToNaverResizeImageUrl } from "@/shared/lib";
import { usePlacePopup } from "@/shared/lib/place-popup";
import { Bookmark, Plus, Star, SquareX, ChevronRight } from "lucide-react";
import { Button } from "@/shared/ui";

/**
 * 피쳐 페이지 컴포넌트
 */
export function FeaturePage() {
  const [activeTab, setActiveTab] = useState("folder");

  const tabs = [
    { id: "folder", label: "저장" },
    { id: "youtube", label: "추천" },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-white dark:bg-surface-950 pb-20">
      {/* 상단 헤더 - 타이포 중심 */}
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md dark:bg-surface-950/80 px-5 pt-8 pb-4">
        <div className="flex items-center gap-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "text-2xl font-black transition-colors relative",
                activeTab === tab.id 
                  ? "text-surface-900 dark:text-white" 
                  : "text-surface-300 dark:text-surface-700"
              )}
            >
              {tab.label}
              {activeTab === tab.id && (
                <div className="absolute -bottom-2 left-0 right-0 h-1 bg-surface-900 dark:bg-white rounded-full" />
              )}
            </button>
          ))}
          <button
            onClick={() => setActiveTab("community")}
            className={cn(
              "text-2xl font-black transition-colors relative",
              activeTab === "community" 
                ? "text-surface-900 dark:text-white" 
                : "text-surface-300 dark:text-surface-700"
            )}
          >
            커뮤니티
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {activeTab === "folder" && <NaverFolderList />}
        {activeTab === "youtube" && <YoutubeChannelList />}
        {activeTab === "community" && (
          <div className="flex flex-col items-center justify-center py-20 text-surface-400">
            <p className="text-lg font-medium">준비 중입니다</p>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * 네이버 폴더 목록 렌더링 컴포넌트
 */
function NaverFolderList() {
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = useNaverFolders();
  const showPopup = usePlacePopup((state) => state.show);

  if (isLoading) return <LoadingSkeleton />;

  const folders = data?.pages.flatMap((page) => page) || [];

  return (
    <div className="flex flex-col gap-10 py-6">
      {folders.map((folder) => (
        <section key={folder.folder_id} className="flex flex-col gap-4 px-4">
          {/* 제목 영역: 타이틀 + 개수 + 구독버튼 */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex flex-col gap-1 flex-1">
              <h3 className="text-xl font-black text-surface-900 dark:text-white leading-tight break-keep">
                {folder.name}
              </h3>
              <div className="flex items-center gap-1.5 text-sm font-medium text-surface-400">
                <span>{folder.place_count}개 매장</span>
              </div>
            </div>
            <Button variant="outline" size="sm" className="h-9 px-4 rounded-full border-surface-200 text-xs font-bold gap-1 flex-shrink-0">
              <Plus className="size-3.5" />
              구독
            </Button>
          </div>

          {folder.memo && (
            <p className="text-sm text-surface-500 dark:text-surface-400 line-clamp-2 -mt-2">
              {folder.memo}
            </p>
          )}

          {/* 장소 슬라이더 */}
          <div className="flex overflow-x-auto scrollbar-hide gap-3 pb-2 -mx-4 px-4 snap-x">
            {folder.preview_places?.map((place: any) => (
              <div 
                key={place.id} 
                className="flex-shrink-0 w-36 snap-start cursor-pointer"
                onClick={() => showPopup(place.id)}
              >
                <div className="relative aspect-[3/4] rounded-xl overflow-hidden mb-2 shadow-sm bg-surface-100 dark:bg-surface-800">
                  {place.thumbnail ? (
                    <img 
                      src={convertToNaverResizeImageUrl(place.thumbnail)} 
                      alt={place.name} 
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-surface-300 dark:text-surface-600">
                      <SquareX className="size-8 stroke-[1.5]" />
                    </div>
                  )}
                  {/* 오버레이 정보 */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                  <div className="absolute bottom-2 left-2 right-8 flex flex-col gap-0.5">
                    <span className="text-white text-[13px] font-bold line-clamp-1">{place.name}</span>
                    <div className="flex items-center gap-1 text-white/80 text-[10px] font-medium">
                      <span>{place.group2}</span>
                      <span className="opacity-50">•</span>
                      <span>{place.category}</span>
                    </div>
                  </div>
                  {/* 저장 버튼 오버레이 (우측 하단) */}
                  <button className="absolute bottom-2 right-2 p-1 text-white/90 hover:text-white transition-colors">
                    <Bookmark className="size-4" />
                  </button>
                </div>
                {/* 하단 점수/리뷰 정보 (이미지 밖) */}
                <div className="flex items-center gap-1.5 mt-1">
                   <div className="flex items-center gap-0.5">
                      <Star className="size-3 text-yellow-400 fill-yellow-400" />
                      <span className="text-[11px] font-black">{place.score || 0}</span>
                   </div>
                   <span className="text-[11px] text-surface-400">({place.review_count || 0})</span>
                </div>
              </div>
            ))}
            
            {/* 더보기 버튼 (가로 스크롤 끝) */}
            {folder.place_count > 10 && (
              <div className="flex-shrink-0 w-36 snap-start flex flex-col">
                <div className="relative aspect-[3/4] rounded-xl border-2 border-dashed border-surface-200 dark:border-surface-800 flex flex-col items-center justify-center gap-2 text-surface-400 hover:text-surface-600 dark:hover:text-surface-200 transition-colors cursor-pointer bg-surface-50 dark:bg-surface-900/50">
                  <div className="w-10 h-10 rounded-full bg-white dark:bg-surface-800 shadow-sm flex items-center justify-center">
                    <ChevronRight className="size-5" />
                  </div>
                  <span className="text-[13px] font-bold">더보기</span>
                </div>
                <div className="mt-auto h-6" /> {/* 정렬용 여백 */}
              </div>
            )}
          </div>
        </section>
      ))}
      
      {hasNextPage && (
        <div className="px-4 py-4">
          <Button 
            variant="ghost" 
            className="w-full text-surface-400" 
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
          >
            {isFetchingNextPage ? "로딩 중..." : "더 보기"}
          </Button>
        </div>
      )}
    </div>
  );
}

/**
 * 유튜브 채널 목록 렌더링 컴포넌트
 */
function YoutubeChannelList() {
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = useYoutubeChannels();
  const showPopup = usePlacePopup((state) => state.show);

  if (isLoading) return <LoadingSkeleton />;

  const channels = data?.pages.flatMap((page) => page) || [];

  return (
    <div className="flex flex-col gap-12 py-6">
      {channels.map((channel) => (
        <section key={channel.channel_id} className="flex flex-col gap-4 px-4">
          {/* 헤더: 채널 프로필(크게) + 이름 + 개수 + 구독버튼 */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-1 overflow-hidden">
              <div className="w-12 h-12 rounded-full bg-surface-200 overflow-hidden flex-shrink-0 border border-surface-100 dark:border-surface-800">
                <img 
                  src={channel.channel_thumbnail} 
                  alt={channel.channel_title} 
                  className="w-full h-full object-cover" 
                  loading="lazy"
                />
              </div>
              <div className="flex flex-col gap-0.5 overflow-hidden">
                <h3 className="text-xl font-black text-surface-900 dark:text-white leading-tight truncate">
                  {channel.channel_title}
                </h3>
                <div className="flex items-center gap-1.5 text-sm font-medium text-surface-400">
                  <span>{channel.place_count}개 매장</span>
                </div>
              </div>
            </div>
            <Button variant="outline" size="sm" className="h-9 px-4 rounded-full border-surface-200 text-xs font-bold gap-1 flex-shrink-0">
              <Plus className="size-3.5" />
              구독
            </Button>
          </div>

          {/* 장소 슬라이더 */}
          <div className="flex overflow-x-auto scrollbar-hide gap-3 pb-2 -mx-4 px-4 snap-x">
            {channel.preview_places?.map((place: any) => (
              <div 
                key={place.id} 
                className="flex-shrink-0 w-36 snap-start cursor-pointer group"
                onClick={() => showPopup(place.id)}
              >
                <div className="relative aspect-[3/4] rounded-xl overflow-hidden mb-2 shadow-sm bg-surface-100 dark:bg-surface-800">
                  {place.thumbnail ? (
                    <img 
                      src={convertToNaverResizeImageUrl(place.thumbnail)} 
                      alt={place.name} 
                      className="w-full h-full object-cover transition-transform group-hover:scale-105"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-surface-300 dark:text-surface-600">
                      <SquareX className="size-8 stroke-[1.5]" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                  <div className="absolute bottom-2 left-2 right-8 flex flex-col gap-0.5">
                    <span className="text-white text-[13px] font-bold line-clamp-1">{place.name}</span>
                    <div className="flex items-center gap-1 text-white/80 text-[10px] font-medium">
                      <span>{place.group2}</span>
                      <span className="opacity-50">•</span>
                      <span>{place.category}</span>
                    </div>
                  </div>
                  {/* 저장 버튼 오버레이 (우측 하단) */}
                  <button className="absolute bottom-2 right-2 p-1 text-white/90 hover:text-white transition-colors">
                    <Bookmark className="size-4" />
                  </button>
                </div>
                {/* 하단 점수/리뷰 정보 */}
                <div className="flex items-center gap-1.5 mt-1">
                   <div className="flex items-center gap-0.5">
                      <Star className="size-3 text-yellow-400 fill-yellow-400" />
                      <span className="text-[11px] font-black">{place.score || 0}</span>
                   </div>
                   <span className="text-[11px] text-surface-400">({place.review_count || 0})</span>
                </div>
              </div>
            ))}

            {/* 더보기 버튼 (가로 스크롤 끝) */}
            {channel.place_count > 10 && (
              <div className="flex-shrink-0 w-36 snap-start flex flex-col">
                <div className="relative aspect-[3/4] rounded-xl border-2 border-dashed border-surface-200 dark:border-surface-800 flex flex-col items-center justify-center gap-2 text-surface-400 hover:text-surface-600 dark:hover:text-surface-200 transition-colors cursor-pointer bg-surface-50 dark:bg-surface-900/50">
                  <div className="w-10 h-10 rounded-full bg-white dark:bg-surface-800 shadow-sm flex items-center justify-center">
                    <ChevronRight className="size-5" />
                  </div>
                  <span className="text-[13px] font-bold">더보기</span>
                </div>
                <div className="mt-auto h-6" />
              </div>
            )}
          </div>
        </section>
      ))}

      {hasNextPage && (
        <div className="px-4 py-4">
          <Button 
            variant="ghost" 
            className="w-full text-surface-400" 
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
          >
            {isFetchingNextPage ? "로딩 중..." : "더 보기"}
          </Button>
        </div>
      )}
    </div>
  );
}

/**
 * 로딩 상태용 스켈레톤 컴포넌트
 */
function LoadingSkeleton() {
  return (
    <div className="flex flex-col gap-8 py-6 px-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex flex-col gap-4 animate-pulse">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-surface-200" />
              <div className="w-24 h-4 bg-surface-200 rounded" />
            </div>
            <div className="w-16 h-8 bg-surface-200 rounded-full" />
          </div>
          <div className="space-y-2">
            <div className="w-3/4 h-6 bg-surface-200 rounded" />
            <div className="w-full h-4 bg-surface-200 rounded" />
          </div>
          <div className="flex gap-3 overflow-hidden">
            {[1, 2, 3].map((j) => (
              <div key={j} className="flex-shrink-0 w-36 aspect-[3/4] bg-surface-200 rounded-xl" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
