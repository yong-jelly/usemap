import { useEffect } from "react";
import { createPortal } from "react-dom";
import { ChevronLeft, X } from "lucide-react";
import { useAuthModalStore } from "../model/useAuthModalStore";
import { LoginPage } from "@/pages/auth/LoginPage";
import { SignupPage } from "@/pages/auth/SignupPage";
import { cn } from "@/shared/lib/utils";

/**
 * 전역 인증 모달 컴포넌트
 * idea-app의 SignUpModal 구조를 참고하여 모바일 대응 및 단계별 네비게이션을 구현했습니다.
 */
export function AuthModal() {
  const { isOpen, view, close, openLogin } = useAuthModalStore();

  // 배경 스크롤 방지 및 ESC 키 처리
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };

    document.addEventListener("keydown", handleEscape);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [isOpen, close]);

  if (!isOpen) return null;

  const handleBack = () => {
    if (view === "signup") {
      openLogin();
    } else {
      close();
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* 배경 오버레이 - 블러 효과와 함께 표시 */}
      <div
        className="absolute inset-0 bg-surface-950/40 backdrop-blur-[4px] animate-in fade-in duration-300"
        onClick={close}
      />

      {/* 모달 컨테이너 - 모바일 대응 (아이폰 등 하단 바 고려하여 pb-safe 등 추가 가능하나 현재는 기본 flex-col) */}
      <div 
        className={cn(
          "relative h-full w-full flex flex-col bg-white dark:bg-surface-900 overflow-hidden animate-in fade-in slide-in-from-bottom-10 duration-500",
          "md:h-auto md:max-h-[85vh] md:w-full md:max-w-[480px] md:rounded-[32px] md:shadow-2xl md:border md:border-surface-100 dark:md:border-surface-800"
        )}
      >
        {/* 헤더 구조 - 뒤로가기 및 타이틀 */}
        <header className="shrink-0 h-16 flex items-center justify-between px-4 border-b border-surface-50 dark:border-surface-800">
          <div className="flex items-center gap-2">
            <button
              onClick={handleBack}
              className="p-2 -ml-2 rounded-full hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors"
              aria-label={view === "signup" ? "로그인으로 돌아가기" : "닫기"}
            >
              <ChevronLeft className="h-6 w-6 text-surface-600 dark:text-surface-400" />
            </button>
            <h1 className="text-lg font-bold text-surface-900 dark:text-surface-50 tracking-tight">
              {view === "login" ? "로그인" : "회원가입"}
            </h1>
          </div>
          
          <button
            onClick={close}
            className="p-2 -mr-2 rounded-full hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors hidden md:block"
          >
            <X className="h-5 w-5 text-surface-400" />
          </button>
        </header>

        {/* 콘텐츠 영역 - 내부 스크롤 가능 */}
        <div className="flex-1 overflow-y-auto scrollbar-hide">
          <div className="p-6 md:p-8">
            {view === "login" ? (
              <LoginPage isModal />
            ) : (
              <SignupPage isModal />
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
