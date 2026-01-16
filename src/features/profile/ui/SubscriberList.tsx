import { useNavigate } from "react-router";
import { useMySubscribers } from "@/entities/user/queries";
import { Loader2, Users, User } from "lucide-react";
import { cn } from "@/shared/lib/utils";

export function SubscriberList() {
  const navigate = useNavigate();
  const { data: subscribers, isLoading } = useMySubscribers();

  if (isLoading) {
    return (
      <div className="flex justify-center p-12">
        <Loader2 className="size-8 text-surface-300 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 py-4">
      {/* 구독자 섹션 */}
      <div className="flex flex-col gap-4">
        <div className="px-5">
          <h2 className="text-xl font-medium text-surface-900 dark:text-white">나를 구독중인 사람들</h2>
          <p className="text-sm text-surface-500">내 맛탐정 폴더를 구독하고 있는 사용자들입니다.</p>
        </div>

        {subscribers && subscribers.length > 0 ? (
          <div className="flex flex-col divide-y divide-surface-50 dark:divide-surface-900 border-t border-surface-50 dark:border-surface-900">
            {subscribers.map((sub) => {
              const mainFolder = sub.folder_names[0];
              const othersCount = sub.total_folders - 1;
              const folderDisplay = othersCount > 0 
                ? `${mainFolder} 외 ${othersCount}개`
                : mainFolder;

              return (
                <div 
                  key={sub.subscriber_id} 
                  className="flex items-center gap-4 p-4 hover:bg-surface-50 dark:hover:bg-surface-900/50 transition-colors cursor-pointer"
                  onClick={() => navigate(`/p/user/${sub.subscriber_id}`)}
                >
                  {/* 프로필 이미지 */}
                  <div className="size-12 rounded-full bg-surface-100 dark:bg-surface-800 flex-shrink-0 overflow-hidden border border-surface-100 dark:border-surface-800">
                    {sub.profile_image_url ? (
                      <img src={sub.profile_image_url} alt={sub.nickname} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-surface-300">
                        <User className="size-6" />
                      </div>
                    )}
                  </div>

                  {/* 정보 */}
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-[15px] text-surface-900 dark:text-white truncate">{sub.nickname}</h4>
                    <p className="text-xs text-surface-500 truncate mt-0.5">
                      <span className="text-primary-500 font-medium">{folderDisplay}</span>
                      <span className="ml-1">구독 중</span>
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="mx-4 p-12 rounded-2xl bg-surface-50 dark:bg-surface-800/50 border border-dashed border-surface-200 dark:border-surface-700 flex flex-col items-center gap-4 text-center">
            <Users className="size-12 text-surface-200" />
            <div>
              <p className="text-sm font-medium text-surface-900 dark:text-white">구독자가 아직 없습니다</p>
              <p className="text-xs text-surface-500 mt-1">멋진 맛탐정 폴더를 만들어 공유해보세요!</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
