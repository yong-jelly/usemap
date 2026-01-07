import { create } from "zustand";
import { supabase } from "@/shared/lib/supabase";
import type { UserProfile } from "./types";

/**
 * 사용자 인증 및 프로필 상태 인터페이스
 */
interface UserState {
  user: any | null; // Supabase Auth 사용자 객체
  profile: UserProfile | null; // tbl_user_profile 테이블의 상세 프로필
  isSyncing: boolean; // 데이터 동기화 중 여부
  setUser: (user: any | null) => void;
  setProfile: (profile: UserProfile | null) => void;
  initSession: () => Promise<void>;
  syncUserFromSession: () => Promise<void>;
}

/**
 * 사용자 관련 상태 관리를 위한 Zustand 스토어
 * 인증 정보 및 프로필 정보를 통합 관리합니다.
 */
export const useUserStore = create<UserState>((set, get) => ({
  user: null,
  profile: null,
  isSyncing: false,

  /**
   * 사용자 객체를 수동으로 설정합니다.
   */
  setUser: (user) => set({ user }),

  /**
   * 프로필 정보를 수동으로 설정합니다.
   */
  setProfile: (profile) => set({ profile }),

  /**
   * 애플리케이션 시작 시 세션을 초기화합니다.
   */
  initSession: async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      set({ user: session.user });
      await get().syncUserFromSession();
    }
  },

  /**
   * 현재 세션으로부터 최신 사용자 및 프로필 정보를 동기화합니다.
   */
  syncUserFromSession: async () => {
    if (get().isSyncing) return;
    set({ isSyncing: true });
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      set({ user });
      
      if (user) {
        // tbl_user_profile 테이블에서 상세 프로필 정보 조회
        const { data: profile, error } = await supabase
          .from("tbl_user_profile")
          .select("*")
          .eq("auth_user_id", user.id)
          .single();
          
        if (!error) {
          set({ profile });
        }
      } else {
        set({ profile: null });
      }
    } finally {
      set({ isSyncing: false });
    }
  },
}));

export * from "./types";
