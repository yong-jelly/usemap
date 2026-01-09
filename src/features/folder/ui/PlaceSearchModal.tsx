import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/shared/ui/Dialog";
import { Input } from "@/shared/ui";
import { Search, Loader2, Plus, X } from "lucide-react";
import { searchPlaceService } from "@/shared/api/edge-function";
import { convertToNaverResizeImageUrl } from "@/shared/lib";

interface PlaceSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (place: any) => void;
}

export function PlaceSearchModal({ isOpen, onClose, onSelect }: PlaceSearchModalProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleSearch = async (val: string) => {
    if (!val.trim()) {
      setResults([]);
      return;
    }

    setIsLoading(true);
    try {
      const res = await searchPlaceService(val);
      if (!res.error) {
        setResults(res.items);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    
    if (query) {
      searchTimeoutRef.current = setTimeout(() => {
        handleSearch(query);
      }, 500);
    } else {
      setResults([]);
    }

    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, [query]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md w-full h-[80dvh] flex flex-col p-0 overflow-hidden bg-white dark:bg-surface-950 border-none">
        <DialogHeader className="p-4 border-b border-surface-100 dark:border-surface-800">
          <div className="flex items-center justify-between mb-4">
            <DialogTitle className="text-xl font-black">장소 추가</DialogTitle>
            <button onClick={onClose} className="p-1 hover:bg-surface-100 dark:hover:bg-surface-800 rounded-full">
              <X className="size-6 text-surface-400" />
            </button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-surface-400" />
            <Input 
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="업체명, 지역 등으로 검색"
              className="pl-10 h-12 bg-surface-50 dark:bg-surface-900 border-none focus-visible:ring-2 focus-visible:ring-primary-500/20"
              autoFocus
            />
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-40 gap-3 text-surface-400">
              <Loader2 className="size-6 animate-spin" />
              <span className="text-sm font-medium">장소 검색 중...</span>
            </div>
          ) : results.length > 0 ? (
            <div className="flex flex-col divide-y divide-surface-50 dark:divide-surface-900">
              {results.map((place) => (
                <button
                  key={place.id}
                  onClick={() => onSelect(place)}
                  className="flex items-center gap-4 p-4 hover:bg-surface-50 dark:hover:bg-surface-900 transition-colors text-left"
                >
                  <div className="size-16 rounded-xl bg-surface-100 dark:bg-surface-800 overflow-hidden flex-shrink-0 border border-surface-50 dark:border-surface-800">
                    {place.image_urls?.[0] ? (
                      <img 
                        src={convertToNaverResizeImageUrl(place.image_urls[0])} 
                        alt={place.name} 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Search className="size-6 text-surface-300" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-surface-900 dark:text-white truncate">{place.name}</h4>
                    <p className="text-xs text-surface-500 mt-0.5 truncate">{place.category}</p>
                    <p className="text-xs text-surface-400 mt-1 truncate">{place.address}</p>
                  </div>
                  <div className="p-2 rounded-full bg-primary-50 dark:bg-primary-900/20 text-primary-500">
                    <Plus className="size-5" />
                  </div>
                </button>
              ))}
            </div>
          ) : query ? (
            <div className="flex flex-col items-center justify-center h-40 text-surface-400">
              <span className="text-sm">검색 결과가 없습니다.</span>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-40 text-surface-300">
              <Search className="size-12 mb-2 opacity-20" />
              <span className="text-sm font-medium">검색어를 입력해주세요.</span>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
