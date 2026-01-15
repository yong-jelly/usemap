import { useNavigate, Navigate } from "react-router";
import { ArrowLeft, Loader2 } from "lucide-react";
import { ProfileEditForm } from "@/features/profile/ui/ProfileEditForm";
import { useUserProfile } from "@/entities/user/queries";
import { useUserStore } from "@/entities/user";

export function ProfileEditPage() {
  const navigate = useNavigate();
  const { data: profile, isLoading: isProfileLoading } = useUserProfile();
  const { isAuthenticated, isSyncing } = useUserStore();

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
    <div className="min-h-screen bg-white dark:bg-neutral-900">
      {/* 헤더 */}
      <div className="sticky top-0 z-10 border-b border-gray-100 bg-white px-4 py-4 dark:border-neutral-800 dark:bg-neutral-900">
        <div className="mx-auto flex max-w-2xl items-center gap-4">
          <button
            onClick={() => navigate("/profile")}
            className="rounded-full p-1 text-gray-500 hover:bg-gray-100 dark:hover:bg-neutral-800"
          >
            <ArrowLeft className="h-6 w-6" />
          </button>
          <h1 className="text-xl font-medium">프로필 수정</h1>
        </div>
      </div>

      {/* 메인 콘텐츠 */}
      <main className="mx-auto max-w-2xl px-4 py-8">
        <ProfileEditForm />
      </main>
    </div>
  );
}
