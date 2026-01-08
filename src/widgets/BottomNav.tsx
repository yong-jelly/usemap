import { Link, useLocation, useNavigate } from "react-router";
import { House, Copy, TvMinimalPlay, User } from "lucide-react";
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
   */
  const navItems = [
    { href: "/", icon: House, label: "홈" },
    { href: "/explore", icon: Copy, label: "둘러보기" },
    { href: "/feature", icon: TvMinimalPlay, label: "트렌드" },
    { href: "/profile", icon: User, label: "프로필" },
  ];

  /**
   * 링크 클릭 시 화면 최상단으로 스크롤합니다.
   */
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-surface-100 bg-white/80 backdrop-blur-md dark:bg-surface-900/80 dark:border-surface-800 transition-transform duration-300">
      <div className="relative mx-auto flex h-14 max-w-lg items-center justify-around p-0">
        {navItems.map((item) => {
          // 현재 경로와 아이템의 경로가 일치하는지 확인
          const isActive = currentPath === item.href || (item.href === "/" && currentPath === "/home");
          
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
                {/* 활성화 상태일 때 작은 점 표시 */}
                {isActive && (
                  <div className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-red-500" />
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
