import { useNavigate } from "react-router";
import { LogOut, PieChart } from "lucide-react";
import { useUserProfile, useLogout } from "@/entities/user/queries";
import { Button } from "@/shared/ui";

export function ProfileHeader() {
  const navigate = useNavigate();
  const { data: profile } = useUserProfile();
  const { mutate: logout } = useLogout();

  if (!profile) return null;

  return (
    <div className="bg-white dark:bg-neutral-900">
      {/* 상단 헤더 바 */}
      <div className="border-b border-gray-100 dark:border-neutral-800">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-4">
          <h1 className="text-lg font-semibold text-gray-900 dark:text-white">프로필</h1>
          <button
            onClick={() => logout()}
            className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-neutral-800 dark:hover:text-gray-200"
            aria-label="로그아웃"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* 프로필 정보 섹션 */}
      <div className="mx-auto max-w-2xl px-4 py-6">
        <div className="mb-6 flex items-start gap-4">
          {/* 프로필 이미지 */}
          <div className="relative h-20 w-20 flex-shrink-0">
            {profile.profile_image_url ? (
              <img
                src={profile.profile_image_url}
                alt={profile.nickname}
                className="h-full w-full rounded-full object-cover border-2 border-gray-100 dark:border-neutral-800"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center rounded-full bg-gray-100 text-2xl font-bold text-gray-400 dark:bg-neutral-800">
                {profile.nickname.charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          {/* 사용자 텍스트 정보 */}
          <div className="flex-1">
            <div className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
              {profile.nickname}
            </div>
            {profile.bio ? (
              <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-300">
                {profile.bio}
              </p>
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                소개 정보가 없습니다.
              </p>
            )}
          </div>
        </div>

        {/* 프로필 액션 버튼 */}
        <div className="mb-2 flex gap-2">
          <Button
            onClick={() => navigate("/profile/edit")}
            variant="secondary"
            className="flex-1 rounded-lg bg-gray-100 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-200 dark:bg-neutral-800 dark:text-gray-300 dark:hover:bg-neutral-700"
          >
            프로필 편집
          </Button>
          <Button
            onClick={() => navigate("/sub-stat/user/me")}
            className="w-[25%] rounded-lg bg-gradient-to-r from-blue-500 to-purple-500 py-2.5 text-sm font-medium text-white hover:from-blue-600 hover:to-purple-600 dark:from-blue-600 dark:to-purple-600"
          >
            <PieChart className="mr-1.5 h-4 w-4" />
            분석
          </Button>
        </div>
      </div>
    </div>
  );
}
