import { useNavigate, Navigate } from "react-router";
import { ChevronLeft, Loader2 } from "lucide-react";
import { useEffect, useRef } from "react";
import { ProfileEditForm } from "@/features/profile/ui/ProfileEditForm";
import { useUserProfile } from "@/entities/user/queries";
import { useUserStore } from "@/entities/user";
import { useUIStore } from "@/shared/model/ui-store";

export function ProfileEditPage() {
  const navigate = useNavigate();
  const formRef = useRef<{ submit: () => void }>(null);
  const { data: profile, isLoading: isProfileLoading } = useUserProfile();
  const { isAuthenticated, isSyncing, logout } = useUserStore();
  const { setBottomNavVisible } = useUIStore();

  useEffect(() => {
    setBottomNavVisible(false);
    return () => setBottomNavVisible(true);
  }, [setBottomNavVisible]);

  const handleLogout = async () => {
    if (window.confirm("로그아웃 하시겠습니까?")) {
      await logout();
      navigate("/");
    }
  };

  const handleSave = () => {
    formRef.current?.submit();
  };

  if (isSyncing || (isProfileLoading && isAuthenticated)) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary-500" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth/login" replace />;
  }

  return (
    <div className="flex min-h-screen flex-col bg-white dark:bg-neutral-900">
      {/* 헤더 */}
      <div className="sticky top-0 z-10 border-b border-gray-100 bg-white px-4 py-4 dark:border-neutral-800 dark:bg-neutral-900">
        <div className="mx-auto flex max-w-2xl items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate("/profile")}
              className="rounded-full p-1 text-gray-500 hover:bg-gray-100 dark:hover:bg-neutral-800"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
          </div>
          <button
            onClick={handleSave}
            className="text-sm font-medium text-primary-500 hover:text-primary-600 dark:text-primary-400"
          >
            저장
          </button>
        </div>
      </div>

      {/* 메인 콘텐츠 */}
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-4 py-8">
        <div className="flex-1">
          <ProfileEditForm ref={formRef} />
        </div>

        {/* 로그아웃 버튼 (하단 중앙) */}
        <div className="mt-auto flex justify-center py-8">
          <button
            onClick={handleLogout}
            className="text-sm font-medium text-gray-400 hover:text-red-500 dark:text-neutral-500 dark:hover:text-red-400"
          >
            로그아웃
          </button>
        </div>
      </main>
    </div>
  );
}
