import { useNavigate } from "react-router";
import { Flame, ChevronRight } from "lucide-react";
import { PlaceSliderCard } from "@/shared/ui/place/PlaceSliderCard";

interface PopularPlacesSectionProps {
  places: any[];
  onPlaceClick: (id: string) => void;
}

export function PopularPlacesSection({ places, onPlaceClick }: PopularPlacesSectionProps) {
  const navigate = useNavigate();

  if (!places || places.length === 0) return null;

  return (
    <section className="mb-8">
      <div className="flex items-center justify-between px-4 mb-4">
        <div className="flex items-center gap-2">
          <Flame className="size-4 text-rose-500" />
          <h2 className="text-base font-bold text-surface-900 dark:text-white">인기</h2>
        </div>
        <button onClick={() => navigate("/feature")} className="text-xs text-surface-400 flex items-center gap-0.5">
          더보기 <ChevronRight className="size-3" />
        </button>
      </div>

      <div className="flex gap-3 px-4 overflow-x-auto no-scrollbar" style={{ WebkitOverflowScrolling: 'touch' }}>
        {places.map((place: any) => (
          <PlaceSliderCard
            key={place.id}
            placeId={place.id}
            name={place.name}
            thumbnail={place.thumbnail}
            category={place.category}
            placeLikedCount={place.popularity_score}
            onClick={onPlaceClick}
          />
        ))}
      </div>
    </section>
  );
}
