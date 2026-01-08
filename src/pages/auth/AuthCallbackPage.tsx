import { useEffect } from "react";
import { useNavigate } from "react-router";
import { supabase } from "@/shared/lib/supabase";
import { useUserStore } from "@/entities/user";
import { useAuthModalStore } from "@/features/auth/model/useAuthModalStore";
import { userApi } from "@/entities/user/api";
import { Loader2 } from "lucide-react";

export function AuthCallbackPage() {
  const navigate = useNavigate();
  const syncUserFromSession = useUserStore((state) => state.syncUserFromSession);
  const { close: closeAuthModal } = useAuthModalStore();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Supabase Auth 세션 처리
        const { error } = await supabase.auth.getSession();
        
        if (error) throw error;

        // 신규 사용자일 경우 프로필 자동 생성을 위해 upsertProfile 호출 (기본값 적용)
        await userApi.upsertProfile({});

        // 세션 정보 동기화 및 프로필 로드
        await syncUserFromSession();

        const { profile } = useUserStore.getState();

        // 인증 성공 후 모달 닫기
        closeAuthModal();

        // 프로필이 성공적으로 생성되었으므로 홈으로 이동
        // 만약 추가 정보 입력이 필수라면 여기서 분기 처리 가능
        navigate("/", { replace: true });
      } catch (error) {
        console.error("Auth callback error:", error);
        navigate("/auth/login", { replace: true });
      }
    };

    handleAuthCallback();
  }, [navigate, syncUserFromSession, closeAuthModal]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-white dark:bg-surface-900">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary-500" />
        <div className="text-center">
          <h2 className="text-xl font-bold text-surface-900 dark:text-surface-50">
            인증 중...
          </h2>
          <p className="text-surface-500 dark:text-surface-400">
            안전하게 로그인 처리를 진행하고 있습니다.
          </p>
        </div>
      </div>
    </div>
  );
}
