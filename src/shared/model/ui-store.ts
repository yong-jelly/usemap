import { create } from "zustand";

interface UIState {
  /** @deprecated BottomNav 제거로 인해 더 이상 사용되지 않음 */
  isBottomNavVisible: boolean;
  /** @deprecated BottomNav 제거로 인해 더 이상 사용되지 않음 */
  setBottomNavVisible: (visible: boolean) => void;
  
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
  closeSidebar: () => void;
  openSidebar: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  isBottomNavVisible: true,
  setBottomNavVisible: (visible: boolean) => set({ isBottomNavVisible: visible }),
  
  isSidebarOpen: false,
  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
  closeSidebar: () => set({ isSidebarOpen: false }),
  openSidebar: () => set({ isSidebarOpen: true }),
}));
