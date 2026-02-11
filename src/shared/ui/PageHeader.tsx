import { useNavigate } from "react-router";
import { ReactNode } from "react";
import { cn } from "@/shared/lib/utils";
import { HorizontalScroll } from "@/shared/ui/HorizontalScroll";
import { Menu } from "lucide-react";
import { useUIStore } from "@/shared/model/ui-store";

export interface TabItem {
  id: string;
  label: string;
}

interface PageHeaderProps {
  tabs: TabItem[];
  activeTab: string;
  onTabChange?: (tabId: string) => void;
  basePath?: string;
  title?: ReactNode;
  actions?: ReactNode;
}

export function PageHeader({ tabs, activeTab, onTabChange, basePath, title, actions }: PageHeaderProps) {
  const navigate = useNavigate();
  const { toggleSidebar } = useUIStore();

  const handleTabClick = (tabId: string) => {
    if (onTabChange) {
      onTabChange(tabId);
    } else if (basePath) {
      navigate(`${basePath}/${tabId}`);
    }
  };

  return (
    <header className="fixed top-0 inset-x-0 z-40">
      <div className="max-w-lg mx-auto bg-white dark:bg-surface-950 border-b border-surface-100 dark:border-surface-800">
        {(title || actions) && (
          <div className="relative flex items-center justify-between px-4 h-14">
            <div className="flex items-center gap-3 relative z-10">
              <button
                onClick={toggleSidebar}
                className="p-1 text-surface-900 dark:text-white hover:bg-surface-100 dark:hover:bg-surface-800 rounded-full transition-colors"
                aria-label="메뉴 열기"
              >
                <Menu className="size-6" />
              </button>
            </div>
            
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
              {typeof title === "string" ? (
                <h1 className="text-lg font-medium text-surface-900 dark:text-white">
                  {title}
                </h1>
              ) : (
                title
              )}
            </div>
            <div className="ml-auto flex items-center gap-3 relative z-10">
              {actions}
            </div>
          </div>
        )}
        {tabs.length > 0 && (
        <div className="px-0 py-2">
          <HorizontalScroll 
            containerClassName="flex items-center gap-2 px-4"
            scrollAmount={200}
            fadeEdges={false}
          >
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabClick(tab.id)}
                className={cn(
                  "px-3 py-1.5 text-sm font-medium transition-colors relative whitespace-nowrap flex-shrink-0 rounded-lg",
                  activeTab === tab.id 
                    ? "bg-surface-900 text-white dark:bg-white dark:text-surface-900" 
                    : "bg-surface-100 text-surface-600 hover:bg-surface-200 dark:bg-surface-800 dark:text-surface-400 dark:hover:bg-surface-700"
                )}
              >
                {tab.label}
              </button>
            ))}
          </HorizontalScroll>
        </div>
        )}
      </div>
    </header>
  );
}
