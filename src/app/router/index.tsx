import { useEffect } from "react";
import { createBrowserRouter, RouterProvider, Outlet, useLocation } from "react-router";
import { Header, BottomNav } from "@/widgets";
import { trackPageView } from "@/shared/lib/gtm";
import { usePlacePopup } from "@/shared/lib/place-popup";
import { AuthModal } from "@/features/auth/ui/AuthModal";
import { Toaster } from "sonner";
import { cn } from "@/shared/lib/utils";

// Page Imports
import { HomePage } from "@/pages/HomePage";
import { FeedPage } from "@/pages/FeedPage";
import { ExplorePage } from "@/pages/ExplorePage";
import { ExplorerPage } from "@/pages/ExplorerPage";
import { FeaturePage } from "@/pages/FeaturePage";
import { FeatureDetailPage } from "@/pages/FeatureDetailPage";
import { MapPage } from "@/pages/MapPage";
import { ReviewPage } from "@/pages/ReviewPage";
import { TrendPage } from "@/pages/TrendPage";
import { WelcomePage } from "@/pages/WelcomePage";
import { NotFoundPage } from "@/pages/NotFoundPage";

// Auth Pages
import { LoginModal } from "@/pages/auth/Login.modal";
import { SignupPage } from "@/pages/auth/SignupPage";
import { AuthCallbackPage } from "@/pages/auth/AuthCallbackPage";
import { ResetPasswordPage } from "@/pages/auth/ResetPasswordPage";

// Group Pages
import { GroupPage } from "@/pages/group/GroupPage";
import { GroupDetailPage } from "@/pages/group/GroupDetailPage";

// Profile Pages
import { ProfilePage } from "@/pages/profile/ProfilePage";
import { ProfileEditPage } from "@/pages/profile/ProfileEditPage";
import { UserSharedFolderPage } from "@/pages/profile/UserSharedFolderPage";

// Folder Pages
import { FolderCreatePage } from "@/pages/folder/FolderCreatePage";
import { FolderDetailPage } from "@/pages/folder/FolderDetailPage";

// Place Pages
import { PlaceDetailPage } from "@/pages/place/PlaceDetailPage";
import { PlaceDetailModal } from "@/features/place/ui/PlaceDetail.modal";
import { InstagramParserPage } from "@/pages/tool/InstagramParserPage";
import { TestMetaPage } from "@/pages/tool/TestMetaPage";

import { useUIStore } from "@/shared/model/ui-store";

/**
 * 페이지 이동 시 스크롤 위치를 최상단으로 복구하는 컴포넌트
 */
function ScrollToTop() {
  const location = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [location.pathname, location.search]);

  return null;
}

/**
 * 페이지 뷰 트래킹을 담당하는 컴포넌트 (GTM)
 */
function PageViewTracker() {
  const location = useLocation();

  useEffect(() => {
    trackPageView(location.pathname + location.search, document.title);
  }, [location.pathname, location.search]);

  return null;
}

/**
 * 공통 레이아웃 컴포넌트
 * 헤더, 하단 네비게이션 및 공통 컨테이너를 포함합니다.
 * 
 * 전역 상태 기반 모달:
 * - usePlacePopup 스토어로 모달 상태 관리
 * - URL 변경 없이 상태로만 모달을 열고 닫아 부모 페이지 재마운트 방지
 * - 스크롤 위치 및 데이터 상태 완벽 유지
 */
function RootLayout() {
  const { isOpen: isPlaceModalOpen, placeId: modalPlaceId } = usePlacePopup();
  const { pathname } = useLocation();
  const { isBottomNavVisible } = useUIStore();

  const isFeatureDetailPage = pathname.includes("/feature/detail/") || 
    (pathname.startsWith("/folder/") && !pathname.includes("/folder/create")) ||
    pathname.startsWith("/p/user/") ||
    pathname.startsWith("/tool/");
  const showBottomNav = !isFeatureDetailPage && isBottomNavVisible;
  
  return (
    <div className="min-h-dvh bg-surface-50 dark:bg-surface-950 text-surface-900 dark:text-surface-50">
      <ScrollToTop />
      <PageViewTracker />
      {/* <Header /> */}
      {/* 메인 모바일 뷰 컨테이너 (최대 너비 512px) */}
      {/* <main className="pt-14 pb-14 max-w-lg mx-auto min-h-dvh bg-white dark:bg-surface-900 shadow-soft-lg border-x border-surface-100 dark:border-surface-800"> */}
      <main className={cn(
        "max-w-lg mx-auto min-h-dvh bg-white dark:bg-surface-900 shadow-soft-lg border-x border-surface-100 dark:border-surface-800",
        showBottomNav ? "pb-32" : "pb-0"
      )}>
        <Outlet />
      </main>
      {showBottomNav && <BottomNav />}
      <AuthModal />
      <Toaster position="top-center" expand={false} richColors />
      
      {/* 전역 장소 상세 모달: usePlacePopup 스토어로 제어 */}
      {isPlaceModalOpen && modalPlaceId && (
        <PlaceDetailModal placeIdFromStore={modalPlaceId} />
      )}
    </div>
  );
}

/**
 * 애플리케이션 라우터 정의
 * 모든 페이지 경로와 해당 컴포넌트를 매핑합니다.
 */
const router = createBrowserRouter([
  {
    path: "/",
    element: <RootLayout />,
    errorElement: <NotFoundPage />,
    children: [
      {
        index: true,
        element: <FeedPage />,
      },
      {
        path: "feed",
        element: <FeedPage />,
      },
      {
        path: "home",
        element: <HomePage />,
      },
      {
        path: "explore2",
        element: <ExplorePage />,
      },
      {
        path: "explorer",
        element: <ExplorerPage />,
      },
      {
        path: "feature",
        children: [
          { path: ":tab?", element: <FeaturePage /> },
          { path: "detail/:type/:id", element: <FeatureDetailPage /> },
        ],
      },
      {
        path: "map",
        element: <MapPage />,
      },
      {
        path: "review",
        element: <ReviewPage />,
      },
      {
        path: "trend",
        element: <TrendPage />,
      },
      {
        path: "welcome",
        element: <WelcomePage />,
      },
      // 인증 관련 라우트
      {
        path: "auth",
        children: [
          { path: "login", element: <LoginModal /> },
          { path: "signup", element: <SignupPage /> },
          { path: "callback", element: <AuthCallbackPage /> },
          { path: "reset-password", element: <ResetPasswordPage /> },
        ],
      },
      // 그룹/모임 관련 라우트
      {
        path: "group",
        children: [
          { index: true, element: <GroupPage /> },
          { path: ":id", element: <GroupDetailPage /> },
        ],
      },
      // 프로필/마이페이지 관련 라우트
      {
        path: "profile",
        children: [
          { path: ":tab?", element: <ProfilePage /> },
          { path: "edit", element: <ProfileEditPage /> },
        ],
      },
      // 폴더(맛탐정) 관련 라우트
      {
        path: "folder",
        children: [
          { path: "create", element: <FolderCreatePage /> },
          { path: ":id", element: <FolderDetailPage /> },
        ],
      },
      // 장소 상세 페이지 라우트
      {
        path: "place/:id",
        element: <PlaceDetailPage />,
      },
      {
        path: "p/status/:id",
        element: <PlaceDetailModal />,
      },
      {
        path: "p/user/:userId",
        element: <UserSharedFolderPage />,
      },
      // 도구 관련 라우트
      {
        path: "tool",
        children: [
          { path: "insta-gram", element: <InstagramParserPage /> },
        ],
      },
      {
        path: "test",
        element: <TestMetaPage />,
      },
      // 정의되지 않은 모든 경로에 대한 404 처리
      {
        path: "*",
        element: <NotFoundPage />,
      },
    ],
  },
]);

/**
 * 라우터 프로바이더 컴포넌트
 */
export function AppRouter() {
  return <RouterProvider router={router} />;
}
