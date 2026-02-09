import { useNavigate } from "react-router";
import { useUserProfile } from "@/entities/user/queries";
import { ChevronRight } from "lucide-react";
import { trackEvent } from "@/shared/lib/gtm";

export function ProfileHeader() {
  const navigate = useNavigate();
  const { data: profile } = useUserProfile();

  if (!profile) return null;

  const handleEditClick = () => {
    trackEvent("profile_edit_click", { location: "header_nickname" });
    navigate("/profile/edit");
  };

  return (
    <div className="bg-white dark:bg-neutral-900">
      {/* 프로필 정보 섹션 */}
      <div className="mx-auto max-w-2xl px-5 py-4">
        <div className="flex items-center gap-4">
          {/* 프로필 이미지 */}
          <div className="relative h-16 w-16 flex-shrink-0">
            {profile.profile_image_url ? (
              <img
                src={profile.profile_image_url}
                alt={profile.nickname}
                loading="lazy"
                decoding="async"
                className="h-full w-full rounded-full object-cover border-2 border-surface-50 dark:border-surface-800 shadow-sm"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center rounded-full bg-surface-100 text-xl font-medium text-surface-300 dark:bg-surface-800 dark:text-surface-600">
                {profile.nickname.charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          {/* 사용자 텍스트 정보 */}
          <div className="flex-1 overflow-hidden">
            <button 
              onClick={handleEditClick}
              className="flex items-center gap-1 group text-left"
            >
              <h2 className="text-xl font-medium text-surface-900 dark:text-white truncate">
                {profile.nickname}
              </h2>
              <ChevronRight className="h-5 w-5 text-surface-300 dark:text-surface-600 font-light" />
            </button>
            <div className="mt-0.5">
              {profile.bio ? (
                <p className="text-sm font-medium text-surface-500 dark:text-surface-400 line-clamp-1 leading-tight">
                  {profile.bio}
                </p>
              ) : (
                <p className="text-xs font-medium text-surface-400 dark:text-surface-500">
                  소개 정보가 없습니다.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
