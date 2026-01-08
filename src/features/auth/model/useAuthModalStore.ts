import { create } from "zustand";

interface AuthModalState {
  isOpen: boolean;
  view: "login" | "signup";
  openLogin: () => void;
  openSignup: () => void;
  close: () => void;
}

export const useAuthModalStore = create<AuthModalState>((set) => ({
  isOpen: false,
  view: "login",
  openLogin: () => set({ isOpen: true, view: "login" }),
  openSignup: () => set({ isOpen: true, view: "signup" }),
  close: () => set({ isOpen: false }),
}));
