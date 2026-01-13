import { useState, useEffect, useRef } from "react";
import { ProfileHeader } from "@/features/profile/ui/ProfileHeader";
import { RecentPlacesTab } from "@/features/profile/ui/RecentPlacesTab";
import { LikedPlacesTab } from "@/features/profile/ui/LikedPlacesTab";
import { VisitedPlacesTab } from "@/features/profile/ui/VisitedPlacesTab";
import { MyReviewsTab } from "@/features/profile/ui/MyReviewsTab";
import { MyFolderList } from "@/features/folder/ui/MyFolderList";
import { SubscriptionList } from "@/features/folder/ui/SubscriptionList";
import { SubscriberList } from "@/features/profile/ui/SubscriberList";
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

  // 페이지 마운트 시 window 스크롤 초기화 (다른 페이지에서 스크롤 후 진입 시 헤더가 밀리는 문제 방지)
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, []);

  // 탭 변경 시 스크롤 최상단 이동
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [activeTab]);

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
    { id: "reviews", label: "리뷰" },
    { id: "folder", label: "맛탐정" },
    { id: "subscription", label: "구독" },
    { id: "subscribers", label: "구독자" },
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
    <div className="flex flex-col min-h-screen bg-white dark:bg-neutral-900">
      {/* 상단 헤더 - 타이포 중심 (FeaturePage 스타일) */}
      <div className="fixed top-0 inset-x-0 bg-white dark:bg-neutral-900 z-20">
        <div className="max-w-lg mx-auto px-5 pt-8 pb-4">
          <div className="flex items-center gap-6 overflow-x-auto overflow-y-hidden scrollbar-hide pb-3">
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
      </div>

      {/* 컨텐츠 영역 */}
      <div 
        className="flex-1 w-full max-w-lg mx-auto pt-24 pb-14"
      >
        {activeTab === "profile" && <ProfileHeader />}
        {activeTab === "recent" && <RecentPlacesTab />}
        {activeTab === "liked" && <LikedPlacesTab />}
        {activeTab === "visited" && <VisitedPlacesTab />}
        {activeTab === "reviews" && <MyReviewsTab />}
        {activeTab === "folder" && <MyFolderList />}
        {activeTab === "subscription" && <SubscriptionList />}
        {activeTab === "subscribers" && <SubscriberList />}
      </div>
    </div>
  );
}
