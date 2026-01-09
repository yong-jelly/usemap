import { useState, useEffect } from "react";
import { ProfileHeader } from "@/features/profile/ui/ProfileHeader";
import { RecentPlacesTab } from "@/features/profile/ui/RecentPlacesTab";
import { LikedPlacesTab } from "@/features/profile/ui/LikedPlacesTab";
import { VisitedPlacesTab } from "@/features/profile/ui/VisitedPlacesTab";
import { MyFolderList } from "@/features/folder/ui/MyFolderList";
import { SubscriptionList } from "@/features/folder/ui/SubscriptionList";
import { useUserProfile } from "@/entities/user/queries";
import { useEnsureDefaultFolder } from "@/entities/folder/queries";
import { useUserStore } from "@/entities/user";
import { Loader2 } from "lucide-react";
import { useNavigate, useParams, Navigate } from "react-router";
import { cn } from "@/shared/lib/utils";

export function ProfilePage() {
  const navigate = useNavigate();
  const { tab } = useParams();
  const { data: profile, isLoading: isProfileLoading } = useUserProfile();
  const { isAuthenticated, isSyncing } = useUserStore();
  const { mutate: ensureDefaultFolder } = useEnsureDefaultFolder();
  
  const activeTab = tab || "profile";

  useEffect(() => {
    if (isAuthenticated) {
      ensureDefaultFolder();
    }
  }, [isAuthenticated, ensureDefaultFolder]);

  const tabs = [
    { id: "profile", label: "프로필" },
    { id: "recent", label: "최근" },
    { id: "liked", label: "좋아요" },
    { id: "visited", label: "방문" },
    { id: "folder", label: "맛탐정" },
    { id: "subscription", label: "구독" },
  ];

  const handleTabChange = (newTabId: string) => {
    navigate(`/profile/${newTabId}`);
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

  // 프로필이 없는 경우 (인증은 되었으나 프로필 생성이 안 된 경우)
  if (!profile && !isProfileLoading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-6 text-center">
        <h2 className="text-2xl font-bold mb-4">프로필 설정이 필요합니다</h2>
        <p className="text-surface-500 mb-8">서비스 이용을 위해 프로필을 먼저 설정해주세요.</p>
        <Navigate to="/profile/edit" replace />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100dvh-56px)] bg-white dark:bg-neutral-900">
      {/* 상단 헤더 - 타이포 중심 (FeaturePage 스타일) */}
      <div className="bg-white dark:bg-neutral-900 px-5 pt-8 pb-4 z-10 flex-shrink-0">
        <div className="flex items-center gap-6 overflow-x-auto scrollbar-hide">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={cn(
                "text-xl font-black transition-colors relative whitespace-nowrap flex-shrink-0",
                activeTab === tab.id 
                  ? "text-surface-900 dark:text-white" 
                  : "text-surface-300 dark:text-surface-700"
              )}
            >
              {tab.label}
              {activeTab === tab.id && (
                <div className="absolute -bottom-2 left-0 right-0 h-1 bg-surface-900 dark:bg-white rounded-full" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* 컨텐츠 영역 */}
      <div className="flex-1 overflow-y-auto scrollbar-hide">
        {activeTab === "profile" && <ProfileHeader />}
        {activeTab === "recent" && <RecentPlacesTab />}
        {activeTab === "liked" && <LikedPlacesTab />}
        {activeTab === "visited" && <VisitedPlacesTab />}
        {activeTab === "folder" && <MyFolderList />}
        {activeTab === "subscription" && <SubscriptionList />}
      </div>
    </div>
  );
}
