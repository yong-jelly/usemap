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
      {/* 프로필 정보 섹션 */}
      <div className="mx-auto max-w-2xl px-5 py-6">
        <div className="mb-8 flex items-center gap-5">
          {/* 프로필 이미지 */}
          <div className="relative h-24 w-24 flex-shrink-0">
            {profile.profile_image_url ? (
              <img
                src={profile.profile_image_url}
                alt={profile.nickname}
                className="h-full w-full rounded-full object-cover border-4 border-surface-50 dark:border-surface-800 shadow-sm"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center rounded-full bg-surface-100 text-3xl font-black text-surface-300 dark:bg-surface-800 dark:text-surface-600">
                {profile.nickname.charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          {/* 사용자 텍스트 정보 */}
          <div className="flex-1 overflow-hidden">
            <h2 className="text-2xl font-black text-surface-900 dark:text-white truncate mb-1">
              {profile.nickname}
            </h2>
            {profile.bio ? (
              <p className="text-base font-medium text-surface-500 dark:text-surface-400 line-clamp-2 leading-tight">
                {profile.bio}
              </p>
            ) : (
              <p className="text-sm font-medium text-surface-400 dark:text-surface-500">
                소개 정보가 없습니다.
              </p>
            )}
          </div>
        </div>

        {/* 프로필 액션 버튼 */}
        <div className="mb-12 flex gap-3">
          <Button
            onClick={() => navigate("/profile/edit")}
            variant="secondary"
            className="flex-1 rounded-2xl h-14 text-lg font-black"
          >
            프로필 편집
          </Button>
          <Button
            onClick={() => navigate("/sub-stat/user/me")}
            className="w-[30%] rounded-2xl h-14 text-lg font-black bg-surface-900 text-white dark:bg-white dark:text-black shadow-lg shadow-surface-900/10"
          >
            {/* <PieChart className="mr-2 h-5 w-5 fill-current" /> */}
            분석
          </Button>
        </div>

        {/* 설정 메뉴 (로그아웃 포함) */}
        <div className="space-y-1">
          <div className="text-xs font-black text-surface-300 dark:text-surface-700 uppercase tracking-widest mb-4 px-1">
            Account
          </div>
          <button
            onClick={() => logout()}
            className="w-full flex items-center justify-between p-4 rounded-2xl hover:bg-surface-50 dark:hover:bg-surface-800/50 transition-colors group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-surface-50 dark:bg-surface-800 flex items-center justify-center group-hover:bg-white dark:group-hover:bg-surface-700 transition-colors shadow-sm">
                <LogOut className="h-5 w-5 text-surface-400 dark:text-surface-500 group-hover:text-accent-rose transition-colors" />
              </div>
              <span className="text-lg font-bold text-surface-600 dark:text-surface-400 group-hover:text-surface-900 dark:group-hover:text-white transition-colors">
                로그아웃
              </span>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
