import { useQuery } from "@tanstack/react-query";
import { homeApi } from "./api";

export const homeKeys = {
  all: ["home"] as const,
  discover: () => [...homeKeys.all, "discover"] as const,
};

export function useHomeDiscover() {
  return useQuery({
    queryKey: homeKeys.discover(),
    queryFn: () => homeApi.getHomeDiscoverData(),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
