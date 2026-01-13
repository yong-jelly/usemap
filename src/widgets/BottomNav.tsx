import React from "react";
import { Link, useLocation, useNavigate } from "react-router";
import { House, Compass, Sparkles, User, Fan } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import { useUserStore } from "@/entities/user";
import { useAuthModalStore } from "@/features/auth/model/useAuthModalStore";

/**
 * 하단 네비게이션 바 컴포넌트
 * 모바일 화면에서 주요 페이지 간 이동을 담당합니다.
 */
export function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const currentPath = location.pathname;
  const { isAuthenticated } = useUserStore();
  const { openLogin } = useAuthModalStore();

  /**
   * 네비게이션 아이템 정의
   * 주제에 맞는 직관적인 아이콘으로 변경 (House, Compass, Sparkles, User)
   */
  const navItems = [
    { href: "/feed", icon: House, label: "피드" },
    { href: "/explore", icon: Compass, label: "탐색" },
    { href: "/feature", icon: Fan, label: "맛탐정" },
    { href: "/profile", icon: User, label: "프로필" },
  ];

  /**
   * 링크 클릭 시 화면 최상단으로 스크롤합니다.
   */
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "auto" });
  };

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-surface-100 bg-white dark:bg-surface-900 dark:border-surface-800">
      <div className="relative mx-auto flex h-14 max-w-lg items-center justify-around p-0">
        {navItems.map((item) => {
          // 현재 경로와 아이템의 경로가 일치하는지 확인
          const isActive = currentPath === item.href || 
            (item.href === "/" && currentPath === "/home") ||
            (item.href !== "/" && currentPath.startsWith(item.href));
          
          const handleClick = (e: React.MouseEvent) => {
            if (item.href === "/profile" && !isAuthenticated) {
              e.preventDefault();
              openLogin();
            } else {
              scrollToTop();
            }
          };

          return (
            <Link
              key={item.href}
              to={item.href}
              onClick={handleClick}
              className={cn(
                "flex h-full flex-1 flex-col items-center justify-center transition-colors",
                isActive
                  ? "text-blue-600 dark:text-blue-400"
                  : "text-surface-600 dark:text-surface-400 hover:text-blue-600 dark:hover:text-blue-400"
              )}
            >
              <div className="relative">
                <item.icon className="h-6 w-6" />
              </div>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
