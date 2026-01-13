import { create } from "zustand";

interface FeaturePageState {
  /** 각 탭별 스크롤 위치 저장 */
  scrollPositions: Record<string, number>;
  /** 커뮤니티 탭의 선택된 도메인 */
  communityDomain: string | null;
  /** 지역 탭의 선택된 소스 */
  regionSource: string | null;
  
  /** 스크롤 위치 설정 */
  setScrollPosition: (tab: string, position: number) => void;
  /** 커뮤니티 도메인 설정 */
  setCommunityDomain: (domain: string | null) => void;
  /** 지역 소스 설정 */
  setRegionSource: (source: string | null) => void;
}

/**
 * 피쳐 페이지의 상태(스크롤 위치, 필터 등)를 전역적으로 관리하여
 * 상세 페이지 이동 후 돌아왔을 때 상태를 유지할 수 있게 합니다.
 */
export const useFeaturePageStore = create<FeaturePageState>((set) => ({
  scrollPositions: {},
  communityDomain: null,
  regionSource: null,
  
  setScrollPosition: (tab, position) => 
    set((state) => ({
      scrollPositions: { ...state.scrollPositions, [tab]: position }
    })),
    
  setCommunityDomain: (domain) => set({ communityDomain: domain }),
  setRegionSource: (source) => set({ regionSource: source }),
}));
