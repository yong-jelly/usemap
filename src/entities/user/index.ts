import { create } from "zustand";
import { persist } from "zustand/middleware";
import { supabase } from "@/shared/lib/supabase";
import type { UserProfile } from "./types";

/**
 * 사용자 인증 및 프로필 상태 인터페이스
 */
interface UserState {
  user: any | null; // Supabase Auth 사용자 객체
  profile: UserProfile | null; // tbl_user_profile 테이블의 상세 프로필
  isSyncing: boolean; // 데이터 동기화 중 여부
  isAuthenticated: boolean; // 인증 여부
  setUser: (user: any | null) => void;
  setProfile: (profile: UserProfile | null) => void;
  initSession: () => Promise<void>;
  syncUserFromSession: () => Promise<void>;
  logout: () => Promise<void>;
}

/**
 * 사용자 관련 상태 관리를 위한 Zustand 스토어
 * 인증 정보 및 프로필 정보를 통합 관리하며 localStorage에 영속화합니다.
 */
export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      user: null,
      profile: null,
      isSyncing: false,
      isAuthenticated: false,

      /**
       * 사용자 객체를 수동으로 설정합니다.
       */
      setUser: (user) => set({ user, isAuthenticated: !!user }),

      /**
       * 프로필 정보를 수동으로 설정합니다.
       */
      setProfile: (profile) => set({ profile }),

      /**
       * 애플리케이션 시작 시 세션을 초기화합니다.
       */
      initSession: async () => {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user) {
            set({ user: session.user, isAuthenticated: true });
            await get().syncUserFromSession();
          } else {
            set({ user: null, profile: null, isAuthenticated: false });
          }
        } catch (error) {
          console.error("[UserStore] 세션 초기화 실패:", error);
          set({ user: null, profile: null, isAuthenticated: false });
        }
      },

      /**
       * 현재 세션으로부터 최신 사용자 및 프로필 정보를 동기화합니다.
       */
      syncUserFromSession: async () => {
        const currentState = get();
        if (currentState.isSyncing) return;
        
        set({ isSyncing: true });
        console.log("[UserStore] 사용자 정보 동기화 시작...");
        
        try {
          // 세션 재확인 (최대 3번 시도)
          let authUser = null;
          for (let i = 0; i < 3; i++) {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
              authUser = user;
              break;
            }
            if (i < 2) await new Promise(r => setTimeout(r, 500));
          }

          if (authUser) {
            set({ user: authUser, isAuthenticated: true });
            
            // tbl_user_profile 테이블에서 상세 프로필 정보 조회
            const { data: profile, error } = await supabase
              .from("tbl_user_profile")
              .select("*")
              .eq("auth_user_id", authUser.id)
              .single();
              
            if (!error && profile) {
              set({ profile });
              console.log("[UserStore] 프로필 동기화 완료:", profile.nickname);
            } else if (error && error.code !== "PGRST116") {
              console.warn("[UserStore] 프로필 조회 에러:", error.message);
            }
          } else {
            console.log("[UserStore] 세션 없음 - 상태 초기화");
            set({ user: null, profile: null, isAuthenticated: false });
          }
        } catch (error) {
          console.error("[UserStore] 사용자 정보 동기화 중 예외 발생:", error);
        } finally {
          set({ isSyncing: false });
        }
      },

      /**
       * 로그아웃 처리
       */
      logout: async () => {
        try {
          await supabase.auth.signOut();
          set({ user: null, profile: null, isAuthenticated: false, isSyncing: false });
        } catch (error) {
          console.error("[UserStore] 로그아웃 실패:", error);
        }
      },
    }),
    {
      name: "usemap-user-storage",
      // user 객체는 직렬화가 복잡할 수 있으므로 profile과 auth 상태 위주로 저장하거나 필요에 따라 조정
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
        profile: state.profile,
      }),
    }
  )
);

export * from "./types";
