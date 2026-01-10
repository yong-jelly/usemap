import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Search, Loader2, X, ChevronLeft, MapPin, History, Trash2 } from "lucide-react";
import { searchPlaceService } from "@/shared/api/edge-function";
import { placeApi } from "@/entities/place/api";
import { convertToNaverResizeImageUrl } from "@/shared/lib";
import { cn } from "@/shared/lib/utils";
import { Input } from "@/shared/ui";
import type { Place, PlaceSearchSummary } from "@/entities/place/types";

const SEARCH_HISTORY_KEY = "place_search_history";
const MAX_HISTORY_COUNT = 10;

interface PlaceSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSearchResults: (places: Place[], query: string) => void;
}

export function PlaceSearchModal({ isOpen, onClose, onSearchResults }: PlaceSearchModalProps) {
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [history, setHistory] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  // 로컬 스토리지에서 검색 기록 불러오기
  useEffect(() => {
    const savedHistory = localStorage.getItem(SEARCH_HISTORY_KEY);
    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory));
      } catch (e) {
        console.error("Failed to parse search history", e);
      }
    }
  }, [isOpen]);

  // 검색 기록 저장
  const saveToHistory = (searchTerm: string) => {
    if (!searchTerm.trim()) return;
    const newHistory = [
      searchTerm,
      ...history.filter((item) => item !== searchTerm),
    ].slice(0, MAX_HISTORY_COUNT);
    setHistory(newHistory);
    localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(newHistory));
  };

  // 검색 기록 삭제
  const removeFromHistory = (searchTerm: string) => {
    const newHistory = history.filter((item) => item !== searchTerm);
    setHistory(newHistory);
    localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(newHistory));
  };

  // 검색 기록 전체 삭제
  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem(SEARCH_HISTORY_KEY);
  };

  const handleSearch = async (val: string) => {
    const trimmedVal = val.trim();
    if (!trimmedVal) return;

    setIsLoading(true);
    saveToHistory(trimmedVal);
    
    try {
      // 1단계: graph-search-place 호출
      const res = await searchPlaceService(trimmedVal);
      
      if (!res.error && res.rows) {
        const ids = res.rows.map((row: PlaceSearchSummary) => row.id);
        
        if (ids.length > 0) {
          // 2단계: v1_list_places_by_ids 호출
          const data = await placeApi.listPlacesByIds(ids);
          const places = data.map(item => item.place_data);
          onSearchResults(places, trimmedVal);
          onClose();
        } else {
          onSearchResults([], trimmedVal);
          onClose();
        }
      } else {
        onSearchResults([], trimmedVal);
        onClose();
      }
    } catch (err) {
      console.error("Search error:", err);
      onSearchResults([], trimmedVal);
      onClose();
    } finally {
      setIsLoading(false);
    }
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch(query);
    }
  };

  // 모달이 열릴 때 부모 스크롤 방지 및 포커스
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] bg-white dark:bg-surface-950 flex flex-col">
      {/* 헤더 */}
      <header className="flex h-14 items-center px-4 border-b border-surface-100 dark:border-surface-800 shrink-0 bg-white dark:bg-surface-900">
        <button onClick={onClose} className="p-1.5 -ml-1.5 rounded-full hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors">
          <ChevronLeft className="h-6 w-6 text-surface-900 dark:text-white" />
        </button>
        <div className="flex-1 ml-2 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-surface-300" />
          <Input 
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="장소, 메뉴, 지역 검색"
            className="w-full bg-surface-50 dark:bg-surface-900 border-none h-11 pl-10 pr-10 rounded-xl font-bold focus-visible:ring-0 dark:text-white"
          />
          {query && (
            <button 
              onClick={() => setQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full bg-surface-200 dark:bg-surface-700 text-surface-500"
            >
              <X className="size-3" />
            </button>
          )}
        </div>
        <button 
          onClick={() => handleSearch(query)}
          disabled={!query.trim() || isLoading}
          className="ml-3 font-bold text-primary-600 disabled:text-surface-300 transition-colors"
        >
          {isLoading ? <Loader2 className="size-5 animate-spin" /> : "검색"}
        </button>
      </header>

      {/* 검색 기록 섹션 */}
      <div className="flex-1 overflow-y-auto bg-white dark:bg-surface-950 p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[15px] font-black text-surface-900 dark:text-white">최근 검색어</h3>
          {history.length > 0 && (
            <button 
              onClick={clearHistory}
              className="text-[12px] font-bold text-surface-400 hover:text-surface-600 dark:hover:text-surface-200 transition-colors"
            >
              전체 삭제
            </button>
          )}
        </div>

        {history.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {history.map((item, index) => (
              <div 
                key={`${item}-${index}`}
                className="flex items-center gap-1.5 pl-3 pr-2 py-1.5 rounded-full bg-surface-50 dark:bg-surface-900 border border-surface-100 dark:border-surface-800 group"
              >
                <button 
                  onClick={() => {
                    setQuery(item);
                    handleSearch(item);
                  }}
                  className="text-sm font-bold text-surface-700 dark:text-surface-300 hover:text-primary-600 transition-colors"
                >
                  {item}
                </button>
                <button 
                  onClick={() => removeFromHistory(item)}
                  className="p-0.5 rounded-full hover:bg-surface-200 dark:hover:bg-surface-800 text-surface-300 hover:text-surface-500 transition-colors"
                >
                  <X className="size-3" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-surface-300 dark:text-surface-700">
            <History className="size-12 opacity-20 mb-4" />
            <p className="text-sm font-bold">최근 검색 기록이 없습니다.</p>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
