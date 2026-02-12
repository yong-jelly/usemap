import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import { 
  House, 
  GalleryVerticalEnd, 
  Microwave,
  Radar,
  X,
  ChevronRight,
  ChevronDown,
  User,
  History,
  Bookmark,
  LogOut,
  Settings
} from "lucide-react";
import { useUIStore } from "@/shared/model/ui-store";
import { useUserStore, isAdmin } from "@/entities/user";
import { useAuthModalStore } from "@/features/auth/model/useAuthModalStore";
import { cn } from "@/shared/lib/utils";
import { Logo } from "@/shared/ui/Logo";
import { useMySubscriptions } from "@/entities/folder/queries";
import naverIcon from "@/assets/images/naver-map-logo.png";

export function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isSidebarOpen, closeSidebar } = useUIStore();
  const { isAuthenticated, profile, logout } = useUserStore();
  const { openLogin } = useAuthModalStore();
  
  const [isSubscriptionsExpanded, setIsSubscriptionsExpanded] = useState(false);
  const { data: subscriptions } = useMySubscriptions();

  // Close sidebar on route change
  useEffect(() => {
    closeSidebar();
  }, [location.pathname, closeSidebar]);

  // Prevent body scroll when sidebar is open
  useEffect(() => {
    if (isSidebarOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isSidebarOpen]);

  const handleProfileClick = (e: React.MouseEvent) => {
    if (!isAuthenticated) {
      e.preventDefault();
      closeSidebar();
      openLogin();
    }
  };

  const handleLogout = () => {
    if (window.confirm("로그아웃 하시겠습니까?")) {
      logout();
      closeSidebar();
      navigate("/feed");
    }
  };

  const menuItems = [
    ...(isAdmin(profile) ? [{ href: "/home", icon: House, label: "홈" }] : []),
    { href: "/feed", icon: GalleryVerticalEnd, label: "피드" },
    { href: "/feature", icon: Microwave, label: "탐색" },
    { href: "/ranking", icon: Radar, label: "테마" },
  ];

  const myPageItems = [
    { href: "/profile", icon: User, label: "내 프로필" },
    { href: "/profile/saved", icon: Bookmark, label: "저장한 장소" },
    { href: "/profile/visited", icon: History, label: "방문 기록" },
    // { href: "/profile/edit", icon: Settings, label: "설정" },
  ];

  // 구독 목록 (더보기 클릭 전에는 최대 5개 표시)
  const displaySubscriptions = isSubscriptionsExpanded 
    ? subscriptions || [] 
    : subscriptions?.slice(0, 5) || [];

  return (
    <>
      {/* Sidebar Container - 콘텐츠 영역에 맞춰 위치 고정 */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 right-0 z-50 max-w-lg mx-auto overflow-hidden pointer-events-none",
          isSidebarOpen && "pointer-events-auto"
        )}
      >
        {/* Backdrop */}
        <div
          onClick={closeSidebar}
          className={cn(
            "absolute inset-0 bg-black/40 transition-opacity duration-200",
            isSidebarOpen ? "opacity-100" : "opacity-0 pointer-events-none"
          )}
        />
        
        {/* Sidebar Panel */}
        <div
          className={cn(
            "absolute top-0 bottom-0 left-0 w-[280px] max-w-[80%] bg-white dark:bg-surface-950 flex flex-col transition-transform duration-200 ease-out",
            isSidebarOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full shadow-none"
          )}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-surface-100 dark:border-surface-800">
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => { navigate("/feed"); closeSidebar(); }}>
              <Logo className="h-6 w-auto" />
            </div>
            <button 
              onClick={closeSidebar}
              className="p-2 hover:bg-surface-100 dark:hover:bg-surface-800 rounded-full transition-colors"
            >
              <X className="size-5 text-surface-500" />
            </button>
          </div>

          {/* Menu Items */}
          <div className="flex-1 overflow-y-auto py-2">
            {/* 기본 메뉴 */}
            <nav className="flex flex-col px-2 gap-1 mb-6">
              {menuItems.map((item) => {
                const isActive = location.pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    to={item.href}
                    className={cn(
                      "flex items-center gap-4 px-4 py-3 rounded-xl transition-colors font-medium",
                      isActive 
                        ? "bg-surface-100 dark:bg-surface-800 text-surface-900 dark:text-white" 
                        : "text-surface-600 dark:text-surface-400 hover:bg-surface-50 dark:hover:bg-surface-900"
                    )}
                  >
                    <item.icon className={cn("size-5", isActive ? "stroke-[2.5px]" : "stroke-[2px]")} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>

            {isAuthenticated && (
              <>
                <div className="h-px bg-surface-100 dark:bg-surface-800 mx-4 mb-4" />
                
                {/* 구독 섹션 */}
                <div className="px-2 mb-6">
                  <Link 
                    to="/my/feed/subscription"
                    className="flex items-center gap-1 px-4 py-2 text-surface-900 dark:text-white font-semibold hover:bg-surface-50 dark:hover:bg-surface-900 rounded-lg mb-1 group"
                  >
                    <span>구독</span>
                    <ChevronRight className="size-4 text-surface-400 group-hover:text-surface-600 transition-colors" />
                  </Link>
                  
                  <div className="flex flex-col gap-1">
                    {displaySubscriptions.map((sub: any) => {
                      const displayThumbnail = sub.subscription_type === 'naver_folder' ? naverIcon : sub.thumbnail;
                      const linkTo = sub.subscription_type === 'folder' 
                        ? `/folder/${sub.feature_id}`
                        : `/feature/detail/${sub.subscription_type === 'naver_folder' ? 'folder' : sub.subscription_type === 'youtube_channel' ? 'youtube' : 'community'}/${sub.feature_id}`;

                      return (
                        <Link
                          key={`${sub.subscription_type}-${sub.feature_id}`}
                          to={linkTo}
                          className="flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-surface-50 dark:hover:bg-surface-900 transition-colors"
                        >
                          <div className="size-6 rounded-full bg-surface-100 dark:bg-surface-800 overflow-hidden flex-shrink-0">
                            {displayThumbnail ? (
                              <img src={displayThumbnail} alt={sub.title} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-surface-300">
                                <User className="size-3" />
                              </div>
                            )}
                          </div>
                          <span className="text-sm text-surface-600 dark:text-surface-300 truncate">{sub.title}</span>
                        </Link>
                      );
                    })}
                    
                    {subscriptions && subscriptions.length > 5 && !isSubscriptionsExpanded && (
                      <button
                        onClick={() => setIsSubscriptionsExpanded(true)}
                        className="flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-surface-50 dark:hover:bg-surface-900 transition-colors w-full text-left"
                      >
                        <div className="size-6 rounded-full bg-surface-100 dark:bg-surface-800 flex items-center justify-center flex-shrink-0">
                          <ChevronDown className="size-4 text-surface-400" />
                        </div>
                        <span className="text-sm text-surface-600 dark:text-surface-300">더보기</span>
                      </button>
                    )}

                    {(!subscriptions || subscriptions.length === 0) && (
                      <div className="px-4 py-2 text-xs text-surface-400">
                        구독 중인 채널이 없습니다.
                      </div>
                    )}
                  </div>
                </div>

                <div className="h-px bg-surface-100 dark:bg-surface-800 mx-4 mb-4" />

                {/* 내 페이지 섹션 */}
                <div className="px-2 mb-6">
                  <Link 
                    to="/profile"
                    className="flex items-center gap-1 px-4 py-2 text-surface-900 dark:text-white font-semibold hover:bg-surface-50 dark:hover:bg-surface-900 rounded-lg mb-1 group"
                  >
                    <span>내 페이지</span>
                    <ChevronRight className="size-4 text-surface-400 group-hover:text-surface-600 transition-colors" />
                  </Link>
                  
                  <div className="flex flex-col gap-1">
                    {myPageItems.map((item) => (
                      <Link
                        key={item.href}
                        to={item.href}
                        className="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-surface-50 dark:hover:bg-surface-900 transition-colors"
                      >
                        <item.icon className="size-5 text-surface-600 dark:text-surface-400 stroke-[2px]" />
                        <span className="text-sm text-surface-600 dark:text-surface-300 font-medium">{item.label}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Footer */}
          {isAuthenticated ? (
            <div className="p-4 border-t border-surface-100 dark:border-surface-800">
               <button
                onClick={handleLogout}
                className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-surface-500 hover:bg-surface-50 dark:hover:bg-surface-900 transition-colors font-medium text-sm"
              >
                <LogOut className="size-5" />
                <span>로그아웃</span>
              </button>
            </div>
          ) : (
            <div className="p-4 border-t border-surface-100 dark:border-surface-800">
              <button
                onClick={() => { closeSidebar(); openLogin(); }}
                className="flex items-center justify-center gap-2 px-4 py-3 w-full rounded-xl bg-primary-500 text-white hover:bg-primary-600 transition-colors font-medium text-sm"
              >
                <User className="size-5" />
                <span>로그인</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
