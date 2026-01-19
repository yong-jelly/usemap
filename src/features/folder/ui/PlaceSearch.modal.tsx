import { useState, useEffect, useRef, useMemo } from "react";
import { createPortal } from "react-dom";
import { CookingPot, Search, Loader2, Plus, X, ChevronLeft, MapPin } from "lucide-react";
import { searchPlaceService } from "@/shared/api/edge-function";
import { placeApi } from "@/entities/place/api";
import { convertToNaverResizeImageUrl } from "@/shared/lib";
import { cn } from "@/shared/lib/utils";
import { Input } from "@/shared/ui";
import type { Place, PlaceSearchSummary } from "@/entities/place/types";
import { PlaceCommentForm } from "./PlaceCommentForm";

/**
 * 장소 검색 모달 컴포넌트
 * 장소 이름을 검색하고 상세 정보를 가져와서 선택할 수 있게 합니다.
 */
interface PlaceSearchModalProps {
  /** 모달 오픈 여부 */
  isOpen: boolean;
  /** 모달 닫기 핸들러 */
  onClose: () => void;
  /** 장소 선택 핸들러 (코멘트 포함) */
  onSelect: (place: Place, comment?: string) => void;
}

export function PlaceSearchModal({ isOpen, onClose, onSelect }: PlaceSearchModalProps) {
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<PlaceSearchSummary[]>([]);
  const [detailedPlaces, setDetailedPlaces] = useState<Place[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 검색어 입력 시 검색 실행 (디바운스)
  useEffect(() => {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    
    if (query.trim()) {
      searchTimeoutRef.current = setTimeout(() => {
        handleSearch(query);
      }, 500);
    } else {
      setSearchResults([]);
      setDetailedPlaces([]);
    }

    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, [query]);

  /**
   * 1단계: graph-search-place 호출하여 장소 ID 목록 확보
   */
  const handleSearch = async (val: string) => {
    setIsLoading(true);
    try {
      const res = await searchPlaceService(val);
      if (!res.error && res.rows) {
        setSearchResults(res.rows);
        
        // 2단계: 확보된 ID들로 상세 정보 조회
        const ids = res.rows.map((row: PlaceSearchSummary) => row.id);
        if (ids.length > 0) {
          fetchDetailedPlaces(ids);
        } else {
          setDetailedPlaces([]);
        }
      }
    } catch (err) {
      console.error("Search error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * 2단계: v1_list_places_by_ids 호출하여 상세 데이터 확보
   */
  const fetchDetailedPlaces = async (ids: string[]) => {
    setIsDetailLoading(true);
    try {
      const data = await placeApi.listPlacesByIds(ids);
      // 응답 구조가 [{ place_data: Place }, ...] 형태이므로 평탄화
      const places = data.map(item => item.place_data);
      setDetailedPlaces(places);
    } catch (err) {
      console.error("Fetch details error:", err);
    } finally {
      setIsDetailLoading(false);
    }
  };

  // 모달이 열릴 때 부모 스크롤 방지
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // 메모 작성 화면 표시
  if (selectedPlace) {
    return createPortal(
      <PlaceCommentForm
        place={selectedPlace}
        onBack={() => setSelectedPlace(null)}
        onSave={async (comment) => {
          try {
            await onSelect(selectedPlace, comment);
            // 성공 시에만 화면 전환
            setSelectedPlace(null);
          } catch (error) {
            // 에러 발생 시 화면 전환 방지 (메모 작성 화면 유지)
            // 에러는 이미 onSelect에서 처리됨
          }
        }}
        onClose={onClose}
      />,
      document.body
    );
  }

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      
      <div className={cn(
        "relative w-full h-full bg-white dark:bg-surface-950 flex flex-col",
        "md:max-w-md md:h-[90vh] md:rounded-[32px] md:overflow-hidden md:shadow-2xl"
      )}>
        {/* 헤더 */}
        <header className="flex h-14 items-center px-4 border-b border-surface-100 dark:border-surface-800 shrink-0 bg-white dark:bg-surface-900">
          <button onClick={onClose} className="p-1.5 -ml-1.5 rounded-full hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors">
            <ChevronLeft className="h-5 w-5 text-surface-600 dark:text-surface-400" />
          </button>
          <h1 className="ml-3 text-lg font-bold text-surface-900 dark:text-surface-50">
            장소 추가
          </h1>
        </header>

        {/* 검색창 섹션 */}
        <div className="p-4 bg-white dark:bg-surface-900 border-b border-surface-50 dark:border-surface-800 shrink-0">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-surface-400" />
            <Input 
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="업체명, 지역 등으로 검색"
              className="pl-11 h-12 bg-surface-50 dark:bg-surface-900 border-none focus-visible:ring-2 focus-visible:ring-primary-500/20 rounded-2xl"
              autoFocus
            />
            {query && (
              <button 
                onClick={() => setQuery("")}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-1 rounded-full bg-surface-200 dark:bg-surface-700 text-surface-500"
              >
                <X className="size-3" />
              </button>
            )}
          </div>
        </div>

        {/* 결과 목록 영역 */}
        <div className="flex-1 overflow-y-auto pb-safe scrollbar-hide">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-60 gap-4">
              <Loader2 className="size-8 animate-spin text-primary-500" />
              <span className="text-sm font-medium text-surface-400">장소 검색 중...</span>
            </div>
          ) : detailedPlaces.length > 0 ? (
            <div className="flex flex-col divide-y divide-surface-50 dark:divide-surface-900">
              {detailedPlaces.map((place) => (
                <button
                  key={place.id}
                  onClick={() => setSelectedPlace(place)}
                  className="flex items-center gap-4 p-5 hover:bg-surface-50 dark:hover:bg-surface-900 transition-colors text-left group"
                >
                  <div className="size-20 rounded-[20px] bg-surface-50 dark:bg-surface-900/50 overflow-hidden flex-shrink-0 border border-surface-100 dark:border-surface-800 shadow-sm flex items-center justify-center">
                    {place.images?.[0] || place.image_urls?.[0] || place.place_images?.[0] ? (
                      <img 
                        src={convertToNaverResizeImageUrl(place.images?.[0] || place.image_urls?.[0] || place.place_images?.[0] || "")} 
                        alt={place.name} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <CookingPot className="size-8 text-surface-200 dark:text-surface-800 stroke-[1.2] opacity-50" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0 py-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-black text-[16px] text-surface-900 dark:text-white truncate">
                        {place.name}
                      </h4>
                      {place.visitor_reviews_score > 0 && (
                        <div className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-yellow-400/10 text-yellow-600 dark:text-yellow-400 text-[10px] font-black">
                          ★ {place.visitor_reviews_score.toFixed(1)}
                        </div>
                      )}
                    </div>
                    <p className="text-xs font-bold text-primary-600 mb-1">{place.category}</p>
                    <p className="text-xs font-medium text-surface-400 line-clamp-2 leading-relaxed">
                      {place.road_address || place.address}
                    </p>
                  </div>
                  <div className="size-10 rounded-2xl bg-primary-50 dark:bg-primary-900/20 text-primary-600 flex items-center justify-center shrink-0 group-hover:bg-primary-500 group-hover:text-white transition-colors">
                    <Plus className="size-5" />
                  </div>
                </button>
              ))}
              {isDetailLoading && (
                <div className="p-4 flex justify-center">
                  <Loader2 className="size-6 animate-spin text-primary-500/50" />
                </div>
              )}
            </div>
          ) : query ? (
            <div className="flex flex-col items-center justify-center h-60 text-surface-400 gap-2">
              <Search className="size-10 opacity-10" />
              <span className="text-sm font-bold">검색 결과가 없습니다.</span>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-80 text-surface-300">
              <div className="size-20 rounded-[32px] bg-surface-50 dark:bg-surface-900 flex items-center justify-center mb-6">
                <Search className="size-10 opacity-20" />
              </div>
              <span className="text-base font-black text-surface-400">어떤 장소를 추가할까요?</span>
              <p className="text-sm font-medium text-surface-300 mt-2">업체명, 지역 등으로 검색해보세요.</p>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
