import { create } from "zustand";

/**
 * 장소 상세 팝업 상태 인터페이스
 */
interface PlacePopupState {
  /** 팝업 열림 여부 */
  isOpen: boolean;
  /** 현재 표시 중인 장소 ID */
  placeId: string | null;
  /** 팝업을 표시합니다. */
  show: (id: string) => void;
  /** 팝업을 닫습니다. */
  hide: () => void;
}

/**
 * 장소 상세 팝업 전역 상태 관리를 위한 Zustand 스토어
 * 어느 페이지에서든 특정 장소의 상세 정보를 띄울 수 있게 합니다.
 */
export const usePlacePopup = create<PlacePopupState>((set) => ({
  isOpen: false,
  placeId: null,
  show: (id) => set({ isOpen: true, placeId: id }),
  hide: () => set({ isOpen: false, placeId: null }),
}));
