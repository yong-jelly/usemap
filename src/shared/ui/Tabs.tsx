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
 */
export function Tabs({ tabs, activeTab, onChange, className }: TabsProps) {
  return (
    <div className={cn("flex border-b border-surface-200 dark:border-surface-800 overflow-x-auto overflow-y-hidden scrollbar-hide pb-1", className)}>
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
              "flex-1 min-w-[80px] py-3 text-sm font-medium transition-colors relative whitespace-nowrap",
              isActive 
                ? "text-blue-600 dark:text-blue-400" 
                : "text-surface-500 hover:text-surface-700 dark:hover:text-surface-300"
            )}
          >
            {tab.label}
            {/* 활성화된 탭 하단 바 표시 */}
            {isActive && (
              <div className="absolute bottom-0 inset-x-0 h-0.5 bg-blue-600 dark:bg-blue-400 animate-in fade-in slide-in-from-bottom-1 duration-200" />
            )}
          </button>
        );
      })}
    </div>
  );
}
