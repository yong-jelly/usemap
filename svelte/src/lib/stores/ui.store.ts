import { writable } from 'svelte/store';

// UI 전역 상태를 관리하는 스토어
export const uiStore = writable({
  isFilterOpen: false,   // 필터 팝업 노출 상태
  isBottomNavVisible: true,  // 하단 네비게이션 노출 상태
  isLoginModalOpen: false,   // 로그인 모달 노출 상태
  path: '', // 현재 url 경로
});

export function setPath(path: string) {
  uiStore.update(state => {
    return {
      ...state,
      path: path
    };
  });
}

// 필터 팝업 열기/닫기 함수
export function toggleFilter({isOpen}: {isOpen?: boolean}) {
  uiStore.update(state => {
    const newIsFilterOpen = isOpen ?? !state.isFilterOpen;
    return {
      ...state,
      isFilterOpen: newIsFilterOpen,
      // 필터가 열리면 하단 네비게이션 숨김, 닫히면 보임
      isBottomNavVisible: !newIsFilterOpen
    };
  });
}

/**
 * 하단 네비게이션 표시/숨김 함수
 * @param isOpen - 하단 네비게이션 표시 여부
 */
export function toggleBottomNav({isOpen}: {isOpen?: boolean}) {
  uiStore.update(state => {
    return {
      ...state,
      isBottomNavVisible: isOpen ?? state.isBottomNavVisible
    };
  });
}

/**
 * 로그인 모달 표시/숨김 함수
 * @param isOpen - 로그인 모달 표시 여부
 */
export function toggleLoginModal({isOpen}: {isOpen?: boolean}) {
  uiStore.update(state => {
    const newIsLoginModalOpen = isOpen ?? !state.isLoginModalOpen;
    return {
      ...state,
      isLoginModalOpen: newIsLoginModalOpen,
      // 로그인 모달이 열리면 하단 네비게이션 숨김, 닫히면 원래 상태로
      isBottomNavVisible: newIsLoginModalOpen ? false : true
    };
  });
}