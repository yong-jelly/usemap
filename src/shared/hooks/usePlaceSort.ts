import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router";
import { useUserLocations } from "@/entities/location";
import { useUserStore } from "@/entities/user";
import { trackEvent } from "@/shared/lib/gtm";

type SortBy = 'recent' | 'distance';

interface SelectedLocation {
  lat: number;
  lng: number;
  id: string;
}

interface UsePlaceSortOptions {
  useUrlSync?: boolean;
  defaultSort?: SortBy;
}

export function usePlaceSort(options: UsePlaceSortOptions = {}) {
  const { useUrlSync = false, defaultSort = 'recent' } = options;
  const { isAuthenticated } = useUserStore();

  const [searchParams, setSearchParams] = useSearchParams();
  const [localSort, setLocalSort] = useState<SortBy>(defaultSort);
  const [isLocationSheetOpen, setIsLocationSheetOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<SelectedLocation | null>(null);

  const sortBy: SortBy = useUrlSync
    ? (searchParams.get('sort') === 'distance' ? 'distance' : 'recent')
    : localSort;

  const { data: userLocations } = useUserLocations({ limit: 1 }, { enabled: isAuthenticated });

  useEffect(() => {
    if (userLocations && userLocations.length > 0 && !selectedLocation) {
      setSelectedLocation({
        lat: userLocations[0].latitude,
        lng: userLocations[0].longitude,
        id: userLocations[0].id,
      });
    }
  }, [userLocations, selectedLocation]);

  useEffect(() => {
    if (useUrlSync && !searchParams.get('sort')) {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        next.set('sort', defaultSort);
        return next;
      }, { replace: true });
    }
  }, [useUrlSync, searchParams, setSearchParams, defaultSort]);

  const setSortBy = useCallback((sort: SortBy) => {
    if (useUrlSync) {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        next.set('sort', sort);
        return next;
      }, { replace: true });
    } else {
      setLocalSort(sort);
    }
  }, [useUrlSync, setSearchParams]);

  const handleSortByRecent = useCallback(() => {
    trackEvent("feed_sort_click", { type: "recent" });
    setSortBy('recent');
  }, [setSortBy]);

  const handleSortByDistance = useCallback(() => {
    trackEvent("feed_sort_click", { type: "distance" });
    if (!selectedLocation) {
      setIsLocationSheetOpen(true);
      return;
    }
    setSortBy('distance');
  }, [selectedLocation, setSortBy]);

  const handleLocationSelect = useCallback((lat: number, lng: number, id: string) => {
    setSelectedLocation({ lat, lng, id });
    setIsLocationSheetOpen(false);
    setSortBy('distance');
  }, [setSortBy]);

  return {
    sortBy,
    selectedLocation,
    isLocationSheetOpen,
    setIsLocationSheetOpen,
    handleSortByRecent,
    handleSortByDistance,
    handleLocationSelect,
  };
}
