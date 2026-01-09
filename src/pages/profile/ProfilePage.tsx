import { useState, useEffect } from "react";
import { ProfileHeader } from "@/features/profile/ui/ProfileHeader";
import { RecentPlacesTab } from "@/features/profile/ui/RecentPlacesTab";
import { SavedPlacesTab } from "@/features/profile/ui/SavedPlacesTab";
import { LikedPlacesTab } from "@/features/profile/ui/LikedPlacesTab";
import { VisitedPlacesTab } from "@/features/profile/ui/VisitedPlacesTab";
import { MyFolderList } from "@/features/folder/ui/MyFolderList";
import { SubscriptionList } from "@/features/folder/ui/SubscriptionList";
import { Tabs } from "@/shared/ui";
import { useUserProfile } from "@/entities/user/queries";
import { useEnsureDefaultFolder } from "@/entities/folder/queries";
import { useUserStore } from "@/entities/user";
import { Loader2 } from "lucide-react";
import { useNavigate, useParams, Navigate } from "react-router";

export function ProfilePage() {
  const navigate = useNavigate();
  const { tab } = useParams();
  const { data: profile, isLoading: isProfileLoading } = useUserProfile();
  const { isAuthenticated, isSyncing } = useUserStore();
  const { mutate: ensureDefaultFolder } = useEnsureDefaultFolder();
  
  const activeTab = tab || "recent";

  useEffect(() => {
    if (isAuthenticated) {
      ensureDefaultFolder();
    }
  }, [isAuthenticated, ensureDefaultFolder]);

  const tabs = [
    { id: "recent", label: "최근" },
    { id: "saved", label: "저장" },
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
    <div className="min-h-screen bg-white dark:bg-neutral-900">
      <ProfileHeader />

      <Tabs
        tabs={tabs}
        activeTab={activeTab}
        onChange={handleTabChange}
        className="sticky top-0 z-10 bg-white/80 backdrop-blur-md dark:bg-neutral-900/80"
      />

      <div className="pb-20">
        {activeTab === "recent" && <RecentPlacesTab />}
        {activeTab === "saved" && <SavedPlacesTab />}
        {activeTab === "liked" && <LikedPlacesTab />}
        {activeTab === "visited" && <VisitedPlacesTab />}
        {activeTab === "folder" && <MyFolderList />}
        {activeTab === "subscription" && <SubscriptionList />}
      </div>
    </div>
  );
}
