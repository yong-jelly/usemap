import { useNavigate } from "react-router";
import { LogOut, PieChart, ChevronRight } from "lucide-react";
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
        </div>

        {/* 설정 메뉴 (로그아웃 포함) */}
        <div className="space-y-2">
          <div className="text-[11px] font-black text-surface-400 dark:text-surface-600 uppercase tracking-[0.2em] mb-3 px-1">
            Account Settings
          </div>
          <button
            onClick={() => logout()}
            className="w-full flex items-center justify-between p-4 rounded-[24px] bg-surface-50/50 dark:bg-surface-800/30 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-all duration-200 group border border-transparent hover:border-rose-100 dark:hover:border-rose-900/30"
          >
            <div className="flex items-center gap-4">
              <div className="w-11 h-11 rounded-2xl bg-white dark:bg-surface-800 flex items-center justify-center group-hover:bg-rose-100 dark:group-hover:bg-rose-900/30 transition-colors shadow-sm">
                <LogOut className="h-5 w-5 text-surface-400 dark:text-surface-500 group-hover:text-accent-rose transition-colors" />
              </div>
              <span className="text-[17px] font-bold text-surface-700 dark:text-surface-300 group-hover:text-accent-rose dark:group-hover:text-rose-400 transition-colors">
                로그아웃
              </span>
            </div>
            <ChevronRight className="h-5 w-5 text-surface-300 dark:text-surface-600 group-hover:text-accent-rose/50 transition-colors" />
          </button>
        </div>
      </div>
    </div>
  );
}
