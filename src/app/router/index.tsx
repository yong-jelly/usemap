import { useEffect } from "react";
import { createBrowserRouter, RouterProvider, Outlet, useLocation } from "react-router";
import { Header, BottomNav } from "@/widgets";
import { trackPageView } from "@/shared/lib/gtm";

// Page Imports
import { HomePage } from "@/pages/HomePage";
import { ExplorePage } from "@/pages/ExplorePage";
import { FeaturePage } from "@/pages/FeaturePage";
import { MapPage } from "@/pages/MapPage";
import { ReviewPage } from "@/pages/ReviewPage";
import { TrendPage } from "@/pages/TrendPage";
import { WelcomePage } from "@/pages/WelcomePage";
import { NotFoundPage } from "@/pages/NotFoundPage";

// Auth Pages
import { LoginPage } from "@/pages/auth/LoginPage";
import { SignupPage } from "@/pages/auth/SignupPage";
import { AuthCallbackPage } from "@/pages/auth/AuthCallbackPage";
import { ResetPasswordPage } from "@/pages/auth/ResetPasswordPage";

// Group Pages
import { GroupPage } from "@/pages/group/GroupPage";
import { GroupDetailPage } from "@/pages/group/GroupDetailPage";

// Profile Pages
import { ProfilePage } from "@/pages/profile/ProfilePage";
import { ProfileEditPage } from "@/pages/profile/ProfileEditPage";

// Place Pages
import { PlaceDetailPage } from "@/pages/place/PlaceDetailPage";

/**
 * 페이지 이동 시 스크롤 위치를 최상단으로 복구하는 컴포넌트
 */
function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [pathname]);

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
 */
function RootLayout() {
  return (
    <div className="min-h-screen bg-surface-50 dark:bg-surface-950 text-surface-900 dark:text-surface-50">
      {/* <ScrollToTop />
      <PageViewTracker /> */}
      {/* <Header /> */}
      {/* 메인 모바일 뷰 컨테이너 (최대 너비 512px) */}
      {/* <main className="pt-14 pb-14 max-w-lg mx-auto min-h-screen bg-white dark:bg-surface-900 shadow-soft-lg border-x border-surface-100 dark:border-surface-800"> */}
      <main className="pb-14 max-w-lg mx-auto min-h-screen bg-white dark:bg-surface-900 shadow-soft-lg border-x border-surface-100 dark:border-surface-800">
        <Outlet />
      </main>
      <BottomNav />
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
        // element: <HomePage />,
        element: <MapPage />,
      },
      {
        path: "home",
        element: <HomePage />,
      },
      {
        path: "explore",
        element: <ExplorePage />,
      },
      {
        path: "feature",
        element: <FeaturePage />,
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
          { path: "login", element: <LoginPage /> },
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
          { index: true, element: <ProfilePage /> },
          { path: "edit", element: <ProfileEditPage /> },
        ],
      },
      // 장소 상세 페이지 라우트
      {
        path: "place/:id",
        element: <PlaceDetailPage />,
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
