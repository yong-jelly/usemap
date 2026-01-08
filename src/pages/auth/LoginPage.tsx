import { Link } from "react-router";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/shared/ui";
import { supabase } from "@/shared/lib/supabase";
import { cn } from "@/shared/lib/utils";
import { useAuthModalStore } from "@/features/auth/model/useAuthModalStore";

interface LoginPageProps {
  isModal?: boolean;
}

export function LoginPage({ isModal }: LoginPageProps) {
  const { openSignup } = useAuthModalStore();

  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) {
      console.error("Google login error:", error);
    }
  };

  return (
    <div className={cn(
      "flex flex-col bg-white dark:bg-surface-900",
      isModal ? "min-h-0" : "min-h-screen"
    )}>
      {/* 헤더 - 모달일 때는 숨김 */}
      {!isModal && (
        <header className="flex h-14 items-center px-4 border-b border-surface-100 dark:border-surface-800">
          <Link
            to="/"
            className="p-1.5 -ml-1.5 rounded-full hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
          >
            <ChevronLeft className="h-5 w-5 text-surface-600 dark:text-surface-400" />
          </Link>
          <h1 className="ml-3 text-lg font-bold text-surface-900 dark:text-surface-50">
            로그인
          </h1>
        </header>
      )}

      {/* 콘텐츠 */}
      <div className={cn(
        "flex-1 flex flex-col items-center justify-center max-w-md mx-auto w-full",
        isModal ? "" : "px-6 py-12"
      )}>
        <div className={cn("text-center", isModal ? "mb-10" : "mb-12")}>
          <div className="flex justify-center mb-6">
            <div className="size-20 bg-primary-50 rounded-3xl flex items-center justify-center rotate-3 shadow-soft-xl">
               <span className="text-3xl">🗺️</span>
            </div>
          </div>
          <h2 className="text-3xl font-black text-surface-950 dark:text-white mb-3 tracking-tight">
            나만의 맛집 지도를<br />만들어보세요!
          </h2>
          <p className="text-surface-500 dark:text-surface-400 font-medium">
            로그인하고 가고 싶은 장소를<br />저장하고 관리해보세요.
          </p>
        </div>

        <div className="w-full space-y-4">
          {/* 구글 로그인 버튼 */}
          <Button
            className={cn(
              "w-full h-[60px] text-[16px] font-bold rounded-full",
              "bg-white border-2 border-surface-200 text-surface-900",
              "hover:bg-surface-50 hover:border-surface-300",
              "dark:bg-black dark:border-surface-800 dark:text-white",
              "dark:hover:bg-surface-900 dark:hover:border-surface-700",
              "flex items-center justify-center gap-3 transition-all active:scale-[0.98] shadow-sm"
            )}
            onClick={handleGoogleLogin}
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Google로 로그인
          </Button>

          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-surface-100 dark:border-surface-800" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white dark:bg-surface-900 text-surface-400 font-medium">
                또는
              </span>
            </div>
          </div>

          <p className="text-center text-[15px] text-surface-500 dark:text-surface-400">
            계정이 없으신가요?{" "}
            {isModal ? (
              <button
                type="button"
                onClick={openSignup}
                className="text-primary-600 dark:text-primary-400 font-bold hover:underline ml-1"
              >
                회원가입
              </button>
            ) : (
              <Link
                to="/auth/signup"
                className="text-primary-600 dark:text-primary-400 font-bold hover:underline ml-1"
              >
                회원가입
              </Link>
            )}
          </p>
        </div>

        {/* 약관 동의 안내 */}
        <p className={cn(
          "text-[12px] text-surface-400 dark:text-surface-500 leading-relaxed text-center",
          isModal ? "mt-12" : "mt-auto"
        )}>
          계속 진행하면 UseMap의{" "}
          <Link to="/terms" className="underline hover:text-surface-600">이용약관</Link>
          및{" "}
          <Link to="/privacy" className="underline hover:text-surface-600">개인정보 처리방침</Link>
          에 동의하게 됩니다.
        </p>
      </div>
    </div>
  );
}
