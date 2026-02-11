import { useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import { 
  House, 
  GalleryVerticalEnd, 
  HatGlasses, 
  Search, 
  Trophy, 
  MessageSquare, 
  CircleUser,
  X,
  LogOut
} from "lucide-react";
import { useUIStore } from "@/shared/model/ui-store";
import { useUserStore, isAdmin } from "@/entities/user";
import { useAuthModalStore } from "@/features/auth/model/useAuthModalStore";
import { cn } from "@/shared/lib/utils";
import { Logo } from "@/shared/ui/Logo";

export function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isSidebarOpen, closeSidebar } = useUIStore();
  const { isAuthenticated, profile, logout } = useUserStore();
  const { openLogin } = useAuthModalStore();

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
    ...(isAdmin(profile) ? [{ href: "/home", icon: House, label: "홈 (Admin)" }] : []),
    { href: "/feed", icon: GalleryVerticalEnd, label: "피드" },
    { href: "/feature", icon: HatGlasses, label: "맛탐정" },
    { href: "/search", icon: Search, label: "검색" },
    { href: "/ranking", icon: Trophy, label: "랭킹" },
    { href: "/review", icon: MessageSquare, label: "리뷰" },
  ];

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
            <nav className="flex flex-col px-2 gap-1">
              {menuItems.map((item) => {
                const isActive = location.pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    to={item.href}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3 rounded-xl transition-colors font-medium",
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

              <div className="my-2 border-t border-surface-100 dark:border-surface-800 mx-2" />

              <Link
                to="/profile"
                onClick={handleProfileClick}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl transition-colors font-medium",
                  location.pathname.startsWith("/profile")
                    ? "bg-surface-100 dark:bg-surface-800 text-surface-900 dark:text-white" 
                    : "text-surface-600 dark:text-surface-400 hover:bg-surface-50 dark:hover:bg-surface-900"
                )}
              >
                <CircleUser className="size-5" />
                <span>프로필</span>
              </Link>
            </nav>
          </div>

          {/* Footer */}
          {isAuthenticated && (
            <div className="p-4 border-t border-surface-100 dark:border-surface-800">
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-surface-500 hover:bg-surface-50 dark:hover:bg-surface-900 transition-colors font-medium text-sm"
              >
                <LogOut className="size-5" />
                <span>로그아웃</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
