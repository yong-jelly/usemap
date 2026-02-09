import { useEffect } from "react";
import { ProfileHeader } from "@/features/profile/ui/ProfileHeader";
import { RecentPlacesTab } from "@/features/profile/ui/RecentPlacesTab";
import { LikedPlacesTab } from "@/features/profile/ui/LikedPlacesTab";
import { SavedPlacesTab } from "@/features/profile/ui/SavedPlacesTab";
import { VisitedPlacesTab } from "@/features/profile/ui/VisitedPlacesTab";
import { MyReviewsTab } from "@/features/profile/ui/MyReviewsTab";
import { MyFolderList } from "@/features/folder/ui/MyFolderList";
import { SubscriptionList } from "@/features/folder/ui/SubscriptionList";
import { SubscriberList } from "@/features/profile/ui/SubscriberList";
import { AnalysisTab } from "@/features/profile/ui/AnalysisTab";
import { ProfileStatsSection } from "@/features/profile/ui/ProfileStatsSection";
import { ProfileMenuSection } from "@/features/profile/ui/ProfileMenuSection";
import { FolderCardList } from "@/features/profile/ui/FolderCardList";
import { useUserProfile } from "@/entities/user/queries";
import { useEnsureDefaultFolder } from "@/entities/folder/queries";
import { useUserStore } from "@/entities/user";
import { Loader2, ChevronLeft, Settings, ChevronRight } from "lucide-react";
import { useNavigate, useParams, Navigate } from "react-router";
import { cn } from "@/shared/lib/utils";

export function ProfilePage() {
  const navigate = useNavigate();
  const { tab } = useParams();
  const { data: profile, isLoading: isProfileLoading } = useUserProfile();
  const { isAuthenticated, isSyncing } = useUserStore();
  const { mutate: ensureDefaultFolder } = useEnsureDefaultFolder();
  
  const activeTab = tab || "profile";

  // 페이지 마운트 시 window 스크롤 초기화
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

  // 프로필이 없는 경우
  if (!profile && !isProfileLoading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-6 text-center">
        <h2 className="text-2xl font-medium mb-4">프로필 설정이 필요합니다</h2>
        <p className="text-surface-500 mb-8">서비스 이용을 위해 프로필을 먼저 설정해주세요.</p>
        <Navigate to="/profile/edit" replace />
      </div>
    );
  }

  // 탭 제목 매핑
  const getTabTitle = (tabId: string) => {
    switch (tabId) {
      case "recent": return "최근";
      case "liked": return "좋아요";
      case "saved": return "저장";
      case "visited": return "방문";
      case "reviews": return "내 리뷰";
      case "folder": return "맛탐정";
      case "subscription": return "구독";
      case "subscribers": return "구독자";
      case "analysis": return "분석";
      default: return "";
    }
  };

  // 메인 프로필 페이지
  if (activeTab === "profile") {
    return (
      <div className="flex flex-col min-h-screen bg-white dark:bg-neutral-900 pb-32">
        {/* 상단 헤더 */}
        <header className="sticky top-0 z-10 bg-white dark:bg-neutral-900 flex items-center justify-between px-4 h-14">
          <button 
            onClick={() => navigate("/feature")}
            className="p-2 -ml-2 text-surface-900 dark:text-white"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button className="p-2 -mr-2 text-surface-900 dark:text-white">
            <Settings className="w-6 h-6" />
          </button>
        </header>

        {/* 프로필 정보 */}
        <ProfileHeader />

        {/* 통계 섹션 */}
        <ProfileStatsSection />

        {/* 메뉴 리스트 */}
        <ProfileMenuSection />

        {/* 컬렉션 (맛탐정) */}
        <div className="mt-4">
          <button 
            onClick={() => navigate("/profile/folder")}
            className="flex items-center justify-between w-full px-5 py-4"
          >
            <h2 className="text-lg font-medium text-surface-900 dark:text-white">맛탐정 폴더</h2>
            <ChevronRight className="w-5 h-5 text-surface-300 dark:text-surface-600" />
          </button>
          <FolderCardList />
        </div>
      </div>
    );
  }

  // 서브 페이지 (탭 컨텐츠)
  return (
    <div className="flex flex-col min-h-screen bg-white dark:bg-neutral-900">
      {/* 서브 페이지 헤더 */}
      <header className="sticky top-0 z-10 bg-white dark:bg-neutral-900 border-b border-surface-100 dark:border-surface-800 flex items-center px-4 h-14">
        <button 
          onClick={() => navigate("/profile")}
          className="p-2 -ml-2 text-surface-900 dark:text-white mr-2"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <h1 className="text-lg font-medium text-surface-900 dark:text-white">
          {getTabTitle(activeTab)}
        </h1>
      </header>

      {/* 컨텐츠 영역 */}
      <div className="flex-1 w-full max-w-lg mx-auto pb-32">
        {activeTab === "analysis" && <AnalysisTab />}
        {activeTab === "recent" && <RecentPlacesTab />}
        {activeTab === "liked" && <LikedPlacesTab />}
        {activeTab === "saved" && <SavedPlacesTab />}
        {activeTab === "visited" && <VisitedPlacesTab />}
        {activeTab === "reviews" && <MyReviewsTab />}
        {activeTab === "folder" && <MyFolderList />}
        {activeTab === "subscription" && <SubscriptionList />}
        {activeTab === "subscribers" && <SubscriberList />}
      </div>
    </div>
  );
}
