import { cn } from "@/shared/lib/utils";
import { trackEvent } from "@/shared/lib/gtm";

/**
 * 개별 탭 아이템 인터페이스
 */
interface Tab {
  id: string;
  label: string;
}

/**
 * 탭 컴포넌트 속성 인터페이스
 */
interface TabsProps {
  /** 탭 목록 */
  tabs: Tab[];
  /** 현재 활성화된 탭 ID */
  activeTab: string;
  /** 탭 변경 시 호출되는 콜백 함수 */
  onChange: (id: string) => void;
  /** 추가적인 CSS 클래스 */
  className?: string;
}

/**
 * 공통 탭 컴포넌트
 * 여러 콘텐츠를 전환하며 표시할 때 사용합니다.
 * YouTube 스타일의 Pill 버튼 형식을 사용합니다.
 */
export function Tabs({ tabs, activeTab, onChange, className }: TabsProps) {
  return (
    <div className={cn("flex gap-2 overflow-x-auto overflow-y-hidden scrollbar-hide py-1", className)}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => {
              trackEvent("tab_click", { tab_id: tab.id, tab_label: tab.label });
              onChange(tab.id);
            }}
            className={cn(
              "px-3 py-1.5 text-sm font-medium transition-colors relative whitespace-nowrap rounded-lg flex-shrink-0",
              isActive 
                ? "bg-surface-900 text-white dark:bg-white dark:text-surface-900" 
                : "bg-surface-100 text-surface-600 hover:bg-surface-200 dark:bg-surface-800 dark:text-surface-400 dark:hover:bg-surface-700"
            )}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
