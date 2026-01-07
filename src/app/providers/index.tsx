import { type ReactNode, useEffect, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useUIStore } from "@/shared/config";
import { supabase } from "@/shared/lib/supabase";
import { useUserStore } from "@/entities/user";

interface ProvidersProps {
  children: ReactNode;
}

/**
 * 전역 프로바이더 컴포넌트
 * TanStack Query, 테마 설정, 인증 상태 관리 등을 통합합니다.
 */
export function Providers({ children }: ProvidersProps) {
  // QueryClient 인스턴스 초기화 (5분 캐싱 설정)
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 1000 * 60 * 5, // 5분 동안 데이터를 fresh한 상태로 유지
      },
    },
  }));

  const { theme } = useUIStore();

  /**
   * 사용자 설정 테마 초기화 및 적용
   */
  useEffect(() => {
    const root = document.documentElement;
    if (theme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
      root.classList.toggle("dark", systemTheme === "dark");
    } else {
      root.classList.toggle("dark", theme === "dark");
    }
  }, [theme]);

  /**
   * 시스템 테마 변경 실시간 감지 (다크 모드 자동 전환)
   */
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = (e: MediaQueryListEvent) => {
      const { theme } = useUIStore.getState();
      if (theme === "system") {
        document.documentElement.classList.toggle("dark", e.matches);
      }
    };
    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  /**
   * 애플리케이션 시작 시 세션 정보 복구
   */
  useEffect(() => {
    useUserStore.getState().initSession();
  }, []);

  /**
   * Supabase 인증 상태 변경 리스너
   * 로그인, 로그아웃, 토큰 갱신 등 발생 시 전역 유저 스토어 동기화
   */
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      // 렌더링 사이클 외부에서 실행되도록 setTimeout 사용
      setTimeout(() => {
        const store = useUserStore.getState();
        if (event === "INITIAL_SESSION") return;
        
        if (event === "SIGNED_IN") {
          store.syncUserFromSession();
        } else if (event === "SIGNED_OUT") {
          store.setUser(null);
          store.setProfile(null);
        } else if (event === "TOKEN_REFRESHED" || event === "USER_UPDATED") {
          if (!store.isSyncing) {
            store.syncUserFromSession();
          }
        }
      }, 0);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
