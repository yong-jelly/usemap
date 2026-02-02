import { useState, useRef, useEffect, useMemo } from "react";
import { useNavigate } from "react-router";
import { cn } from "@/shared/lib/utils";
import { Youtube, Instagram, MapPin, ChevronLeft, ChevronRight, User } from "lucide-react";
import { HorizontalScroll } from "@/shared/ui/HorizontalScroll";
import { CollectionCard } from "@/widgets/DiscoverGrid";
import { usePlacePopup } from "@/shared/lib/place-popup";

const REGIONS = ['서울', '경기', '부산', '대구', '인천', '강원', '제주', '대전', '광주', '전북', '전남', '경북', '경남', '충북', '충남'];

export function SourceContent() {
  const [activeRegion, setActiveRegion] = useState('전체');
  const [sourceData, setSourceData] = useState<{ featured_groups: any[], places: any[] }>({ featured_groups: [], places: [] });
  const [discoverData, setDiscoverData] = useState<any>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { show: showPlaceModal } = usePlacePopup();

  useEffect(() => {
    // Load both source.json and discover.json
    Promise.all([
      fetch('/source.json').then(res => res.json()),
      fetch('/discover.json').then(res => res.json())
    ]).then(([source, discover]) => {
      setSourceData(source);
      setDiscoverData(discover);
    }).catch(err => console.error("Failed to load data:", err));
  }, []);

  // Generate random places from discoverData
  const randomPlaces = useMemo(() => {
    if (!discoverData?.popularPlaces) return [];
    
    const basePlaces = discoverData.popularPlaces;
    const result = [];
    
    // Create ~3x more places by shuffling and repeating with variations
    for (let i = 0; i < 3; i++) {
      const shuffled = [...basePlaces].sort(() => Math.random() - 0.5);
      result.push(...shuffled.map((p: any, idx: number) => ({
        ...p,
        id: `${p.id}-${i}-${idx}`, // Unique ID for key
        region: REGIONS[Math.floor(Math.random() * REGIONS.length)],
        sourceCount: Math.floor(Math.random() * 20) + 1,
        aspect: ['aspect-[3/4]', 'aspect-square', 'aspect-[4/5]', 'aspect-[2/3]', 'aspect-[3/2]', 'aspect-[4/3]'][Math.floor(Math.random() * 4)],
        owner_nickname: ['성시경', '쯔양', '신콕', '맛탐정', '다모앙', '클리앙'][Math.floor(Math.random() * 6)],
      })));
    }
    
    return result.sort(() => Math.random() - 0.5);
  }, [discoverData]);

  const filteredPlaces = activeRegion === '전체' 
    ? randomPlaces 
    : randomPlaces.filter(p => p.region === activeRegion);

  // Cross verified places (high sourceCount)
  const crossVerifiedPlaces = useMemo(() => {
    return [...randomPlaces]
      .filter(p => p.sourceCount >= 15)
      .slice(0, 3);
  }, [randomPlaces]);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const { scrollLeft, clientWidth } = scrollRef.current;
      const scrollTo = direction === 'left' ? scrollLeft - clientWidth / 2 : scrollLeft + clientWidth / 2;
      scrollRef.current.scrollTo({ left: scrollTo, behavior: 'smooth' });
    }
  };

  return (
    <div className="pb-32 min-h-screen bg-white dark:bg-surface-950">
      
      {/* 2. Featured Slider (Banner Style) */}
      <section className="pt-6 pb-2">
        <div className="px-4 mb-4">
          <h2 className="text-lg font-medium text-surface-900 dark:text-white">
            실시간 미식 아카이브
          </h2>
        </div>
        <HorizontalScroll 
          containerClassName="flex items-center gap-4 px-4 pb-6"
          scrollAmount={300}
        >
          {sourceData.featured_groups.map((group) => (
            <FeaturedBannerCard key={group.id} group={group} />
          ))}
        </HorizontalScroll>
      </section>

      {/* 3. Region Filter (Fixed 'All' on left) */}
      <div className="sticky top-[88px] z-30 bg-white/95 dark:bg-surface-950/95 backdrop-blur-sm border-b border-surface-100 dark:border-surface-800 py-3">
        <div className="relative flex items-center">
          {/* Fixed 'All' button on the left */}
          <div className="pl-4 pr-2 z-20 bg-white dark:bg-surface-950 border-r border-surface-100 dark:border-surface-800">
            <button
              onClick={() => setActiveRegion('전체')}
              className={cn(
                "px-4 py-1.5 rounded-full text-sm font-medium transition-all border whitespace-nowrap",
                activeRegion === '전체'
                  ? "bg-surface-900 text-white border-surface-900 dark:bg-white dark:text-surface-900 dark:border-white shadow-sm"
                  : "bg-white text-surface-500 border-surface-200 dark:bg-surface-900 dark:text-surface-400 dark:border-surface-800"
              )}
            >
              전체
            </button>
          </div>

          <div className="relative flex-1 flex items-center px-2 overflow-hidden">
            <button 
              onClick={() => scroll('left')}
              className="absolute left-0 z-10 p-1 bg-white/80 dark:bg-surface-900/80 rounded-full shadow-sm border border-surface-100 dark:border-surface-800"
            >
              <ChevronLeft className="size-4" />
            </button>
            
            <div 
              ref={scrollRef}
              className="flex items-center gap-2 overflow-x-auto no-scrollbar px-6"
            >
              {REGIONS.map((region) => (
                <button
                  key={region}
                  onClick={() => setActiveRegion(region)}
                  className={cn(
                    "px-4 py-1.5 rounded-full text-sm font-medium transition-all whitespace-nowrap border shrink-0",
                    activeRegion === region
                      ? "bg-surface-900 text-white border-surface-900 dark:bg-white dark:text-surface-900 dark:border-white shadow-sm"
                      : "bg-white text-surface-500 border-surface-200 dark:bg-surface-900 dark:text-surface-400 dark:border-surface-800 hover:bg-surface-100 dark:hover:bg-surface-800"
                  )}
                >
                  {region}
                </button>
              ))}
            </div>

            <button 
              onClick={() => scroll('right')}
              className="absolute right-0 z-10 p-1 bg-white/80 dark:bg-surface-900/80 rounded-full shadow-sm border border-surface-100 dark:border-surface-800"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="px-4 space-y-8 mt-6">
        
        {/* 4. Cross Verified Section */}
        {activeRegion === '전체' && crossVerifiedPlaces.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-4">
              <h2 className="text-lg font-medium text-surface-900 dark:text-white">
                여러 입맛이 교차하며 증명된 곳
              </h2>
            </div>
            <div className="space-y-3">
              {crossVerifiedPlaces.map((place) => (
                <CrossVerifiedPlaceCard key={`cv-${place.id}`} place={place} />
              ))}
            </div>
          </section>
        )}

        {/* 5. Place Masonry Grid (Using CollectionCard) */}
        <section>
           <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium text-surface-900 dark:text-white">
                {activeRegion}의 생생한 미식 기록
              </h2>
              <span className="text-xs text-surface-400">{filteredPlaces.length}개 장소</span>
            </div>
            
            <div className="columns-2 gap-x-3 gap-y-0">
              {filteredPlaces.map((place, idx) => (
                <div key={`p-${place.id}`} className={cn(
                  "break-inside-avoid",
                  idx % 3 === 0 ? "mb-6" : "mb-4"
                )}>
                  <CollectionCard 
                    item={{ type: 'place', data: place }} 
                    index={idx}
                    onPlaceClick={showPlaceModal}
                    onClick={() => showPlaceModal(place.id.split('-')[0])}
                  />
                </div>
              ))}
            </div>
        </section>
      </div>
    </div>
  );
}

// --- Components ---

function FeaturedBannerCard({ group }: { group: any }) {
  return (
    <div className="flex-shrink-0 w-[280px] h-[160px] rounded-3xl bg-surface-900 border border-surface-100 dark:border-surface-800 shadow-xl overflow-hidden relative group cursor-pointer">
      <div className="absolute inset-0">
        <img 
          src={group.image} 
          alt={group.name} 
          className="w-full h-full object-cover opacity-50 group-hover:scale-105 transition-transform duration-700" 
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
      </div>
      
      <div className="absolute inset-0 p-5 flex flex-col justify-between z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {group.icon ? (
              <div className="w-10 h-10 rounded-full border-2 border-white/20 overflow-hidden bg-white/10 backdrop-blur-md">
                <img src={group.icon} alt="" className="w-full h-full object-cover" />
              </div>
            ) : (
              <div className="w-10 h-10 rounded-full border-2 border-white/20 bg-white/10 backdrop-blur-md flex items-center justify-center">
                <User className="size-5 text-white" />
              </div>
            )}
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-white/60 uppercase tracking-widest">
                {group.type}
              </span>
              <span className="text-xs font-medium text-white/90">
                {group.type === 'youtube' ? 'YouTube Channel' : group.type === 'social' ? 'Instagram' : 'Detective'}
              </span>
            </div>
          </div>
          <div className="px-2 py-1 rounded-lg bg-white/10 backdrop-blur-md border border-white/10 text-[10px] font-bold text-white uppercase">
            Featured
          </div>
        </div>
        
        <div>
          <h3 className="text-lg font-bold text-white leading-tight mb-1 drop-shadow-md">
            {group.name}
          </h3>
          <div className="flex items-center gap-2 text-xs text-white/70">
            <span>{group.subtext}</span>
            <span className="w-1 h-1 rounded-full bg-white/30" />
            <span className="font-bold text-white">{group.count}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function CrossVerifiedPlaceCard({ place }: { place: any }) {
  const { show: showPlaceModal } = usePlacePopup();
  return (
    <div 
      onClick={() => showPlaceModal(place.id.split('-')[0])}
      className="flex gap-3 p-3 rounded-xl bg-white dark:bg-surface-900 border border-surface-100 dark:border-surface-800 shadow-sm cursor-pointer hover:border-primary-200 dark:hover:border-primary-800 transition-colors"
    >
      <div className="w-20 h-20 rounded-lg bg-surface-100 dark:bg-surface-800 flex-shrink-0 overflow-hidden">
        {place.thumbnail ? (
          <img src={place.thumbnail} alt={place.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-surface-300">
            <MapPin className="size-6" />
          </div>
        )}
      </div>
      
      <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
        <div>
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-base font-medium text-surface-900 dark:text-white truncate">{place.name}</h3>
            <span className="text-xs font-medium text-primary-600 bg-primary-50 dark:bg-primary-900/20 px-1.5 py-0.5 rounded">
              {place.sourceCount}개 소스
            </span>
          </div>
          <p className="text-xs text-surface-500 truncate">{place.category || '음식점'}</p>
        </div>
      </div>
    </div>
  );
}
