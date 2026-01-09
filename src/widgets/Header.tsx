import { Logo } from "@/shared/ui/Logo";
import { MessageSquare, Bell } from "lucide-react";
import { Button } from "@/shared/ui";

/**
 * 상단 헤더 컴포넌트
 * 로고와 알림, 메시지 등 전역 액션 버튼을 포함합니다.
 */
export function Header() {
  return (
    <header className="fixed top-0 inset-x-0 z-50 bg-white border-b border-surface-200 dark:bg-surface-900 dark:border-surface-800">
      <div className="flex items-center justify-between h-14 px-4 max-w-lg mx-auto">
        <div className="flex items-center">
          <Logo />
        </div>
        <div className="flex items-center gap-2">
          {/* 메시지함 버튼 */}
          <Button variant="ghost" size="icon" className="text-surface-600 dark:text-surface-400">
            <MessageSquare className="size-5" />
          </Button>
          {/* 알림 센터 버튼 */}
          <Button variant="ghost" size="icon" className="text-surface-600 dark:text-surface-400">
            <Bell className="size-5" />
          </Button>
        </div>
      </div>
    </header>
  );
}
