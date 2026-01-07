import { create } from "zustand";
import { persist } from "zustand/middleware";

/**
 * 테마 설정 타입
 * light: 라이트 모드
 * dark: 다크 모드
 * system: 시스템 설정에 따름
 */
type Theme = "light" | "dark" | "system";

/**
 * UI 상태를 관리하는 스토어 인터페이스
 */
interface UIStore {
  theme: Theme;
  sidebarOpen: boolean;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
}

/**
 * 전역 UI 상태 관리를 위한 Zustand 스토어
 * 테마 설정 및 사이드바 열림 상태를 영속적으로 관리합니다.
 */
export const useUIStore = create<UIStore>()(
  persist(
    (set, get) => ({
      theme: "system",
      sidebarOpen: true,

      /**
       * 테마를 설정하고 문서에 적용합니다.
       */
      setTheme: (theme) => {
        set({ theme });
        applyTheme(theme);
      },

      /**
       * 라이트/다크 테마를 토글합니다.
       */
      toggleTheme: () => {
        const currentTheme = get().theme;
        const newTheme = currentTheme === "dark" ? "light" : "dark";
        set({ theme: newTheme });
        applyTheme(newTheme);
      },

      /**
       * 사이드바 열림 상태를 설정합니다.
       */
      setSidebarOpen: (open) => set({ sidebarOpen: open }),

      /**
       * 사이드바 열림 상태를 토글합니다.
       */
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
    }),
    {
      name: "ui-storage", // localStorage 저장 키
      onRehydrateStorage: () => (state) => {
        // 스토리지가 복구되었을 때 테마 적용
        if (state) {
          applyTheme(state.theme);
        }
      },
    }
  )
);

/**
 * 테마 설정을 실제 DOM에 적용합니다.
 * 'dark' 클래스를 <html> 요소에 추가하거나 제거합니다.
 */
function applyTheme(theme: Theme) {
  if (typeof window === "undefined") return;
  
  const root = document.documentElement;
  
  if (theme === "system") {
    const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
    root.classList.toggle("dark", systemTheme === "dark");
  } else {
    root.classList.toggle("dark", theme === "dark");
  }
}
