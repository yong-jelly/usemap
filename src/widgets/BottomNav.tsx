import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "react-router";
import { House, Compass, User, Fan, HatGlasses } from "lucide-react";
import { 
  motion, 
  useReducedMotion 
} from "framer-motion";
import { cn } from "@/shared/lib/utils";
import { useUserStore } from "@/entities/user";
import { useAuthModalStore } from "@/features/auth/model/useAuthModalStore";
import { trackEvent } from "@/shared/lib/gtm";

/**
 * 성능 최적화가 적용된 하단 네비게이션 바
 * 스크롤 시 투명해지며, 클릭 시 즉각적인 피드백을 제공합니다.
 */
export function BottomNav() {
  const location = useLocation();
  const currentPath = location.pathname;
  const { isAuthenticated } = useUserStore();
  const { openLogin } = useAuthModalStore();
  const shouldReduceMotion = useReducedMotion();
  
  const [isVisible, setIsVisible] = useState(true);
  const lastScrollY = useRef(0);
  const scrollThreshold = 10;

  const navItems = [
    { href: "/feed", icon: House, label: "피드" },
    { href: "/explore", icon: Compass, label: "탐색" },
    { href: "/feature", icon: HatGlasses, label: "맛탐정" },
    { href: "/profile", icon: User, label: "프로필" },
  ];

  useEffect(() => {
    let scrollTimeout: ReturnType<typeof setTimeout>;

    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const diff = currentScrollY - lastScrollY.current;

      // 스크롤 시 즉시 투명해짐
      if (Math.abs(diff) > scrollThreshold) {
        if (diff > 0 && isVisible) {
          setIsVisible(false);
        } else if (diff < 0 && !isVisible) {
          setIsVisible(true);
        }
      }

      lastScrollY.current = currentScrollY;

      // 스크롤이 멈추면 다시 원래대로 (200ms 후)
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        setIsVisible(true);
      }, 200);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
      clearTimeout(scrollTimeout);
    };
  }, [isVisible]);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "auto" });
  };

  return (
    <motion.nav
      initial={{ y: 20, opacity: 0 }}
      animate={{ 
        y: 0, 
        x: "-50%",
        opacity: isVisible ? 1 : 0.4,
        scale: isVisible ? 1 : 0.97,
      }}
      transition={{
        type: "spring",
        stiffness: 400,
        damping: 30
      }}
      className="fixed bottom-6 left-1/2 z-50 flex w-[75vw] max-w-[400px] items-center justify-center pointer-events-none"
    >
      <div 
        className={cn(
          "relative flex w-full h-16 items-center justify-around rounded-full px-2 pointer-events-auto overflow-hidden",
          "bg-white dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-700",
          "shadow-[0_10px_30px_rgba(0,0,0,0.15)] transition-opacity duration-200"
        )}
      >
        {navItems.map((item) => {
          const isActive = currentPath === item.href || 
            (item.href === "/" && currentPath === "/home") ||
            (item.href !== "/" && currentPath.startsWith(item.href));
          
          const handleClick = (e: React.MouseEvent) => {
            trackEvent("nav_click", {
              button_name: item.label,
              href: item.href,
              location: "bottom_nav"
            });

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
                "group relative flex h-full flex-1 flex-col items-center justify-center outline-none transition-colors",
                isActive ? "text-neutral-950 dark:text-white" : "text-neutral-500 dark:text-neutral-400"
              )}
            >
              {/* 더 진해진 배경 하이라이트 */}
              {isActive && (
                <div className="absolute inset-0 mx-auto my-auto h-12 w-12 rounded-full bg-neutral-200/80 dark:bg-neutral-800" />
              )}

              <motion.div 
                className="relative z-10"
                whileTap={shouldReduceMotion ? {} : { scale: 0.92 }}
              >
                <item.icon className={cn(
                  "h-6 w-6", 
                  isActive ? "stroke-[2.8px]" : "stroke-[2.2px]"
                )} />
              </motion.div>
            </Link>
          );
        })}
      </div>
    </motion.nav>
  );
}
