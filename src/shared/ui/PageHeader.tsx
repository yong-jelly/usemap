import { useNavigate } from "react-router";
import { ReactNode } from "react";
import { cn } from "@/shared/lib/utils";
import { HorizontalScroll } from "@/shared/ui/HorizontalScroll";

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
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
              {typeof title === "string" ? (
                <h1 className="text-lg font-medium text-surface-900 dark:text-white relative">
                  {title}
                  {tabs.length === 0 && (
                    <div className="absolute -bottom-2 left-0 right-0 h-1 bg-surface-900 dark:bg-white rounded-full" />
                  )}
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
        <div className="px-0">
          <HorizontalScroll 
            containerClassName="flex items-center gap-4 px-4"
            scrollAmount={200}
            fadeEdges={false}
          >
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabClick(tab.id)}
                className={cn(
                  "py-3 text-sm font-medium transition-colors relative whitespace-nowrap flex-shrink-0",
                  activeTab === tab.id 
                    ? "text-surface-900 dark:text-white" 
                    : "text-surface-400 dark:text-surface-500"
                )}
              >
                {tab.label}
                {activeTab === tab.id && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-surface-900 dark:bg-white" />
                )}
              </button>
            ))}
          </HorizontalScroll>
        </div>
      </div>
    </header>
  );
}
