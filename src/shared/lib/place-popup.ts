import { create } from "zustand";

/**
 * 장소 상세 팝업 상태 인터페이스
 */
interface PlacePopupState {
  /** 팝업 열림 여부 */
  isOpen: boolean;
  /** 현재 표시 중인 장소 ID */
  placeId: string | null;
  /** 팝업을 표시합니다. (URL도 함께 변경하여 공유/북마크 지원) */
  show: (id: string) => void;
  /** 팝업을 닫습니다. */
  hide: () => void;
}

/**
 * 장소 상세 팝업 전역 상태 관리를 위한 Zustand 스토어
 * 어느 페이지에서든 특정 장소의 상세 정보를 띄울 수 있게 합니다.
 * 
 * URL 변경 없이 상태로만 모달을 제어하여 부모 페이지 재마운트를 방지합니다.
 */
export const usePlacePopup = create<PlacePopupState>((set, get) => ({
  isOpen: false,
  placeId: null,
  show: (id) => {
    // URL 변경 (공유/북마크 지원) - 실제 라우팅 없이 URL만 변경
    window.history.pushState({ placePopup: true }, "", `/p/status/${id}`);
    set({ isOpen: true, placeId: id });
  },
  hide: () => {
    // 상태 닫고 URL도 뒤로가기로 복원
    set({ isOpen: false, placeId: null });
    window.history.back();
  },
}));

// 브라우저 뒤로가기/앞으로가기 버튼 처리
if (typeof window !== "undefined") {
  window.addEventListener("popstate", (event) => {
    const { isOpen } = usePlacePopup.getState();
    
    // 모달이 열려있는데 뒤로가기 하면 모달 닫기
    if (isOpen) {
      usePlacePopup.setState({ isOpen: false, placeId: null });
    }
    // 앞으로가기로 모달 URL로 돌아온 경우
    else if (window.location.pathname.startsWith("/p/status/")) {
      const placeId = window.location.pathname.split("/p/status/")[1];
      if (placeId) {
        usePlacePopup.setState({ isOpen: true, placeId });
      }
    }
  });
}
