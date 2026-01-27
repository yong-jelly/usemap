import { useNavigate } from "react-router";
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
}

export function PageHeader({ tabs, activeTab, onTabChange, basePath }: PageHeaderProps) {
  const navigate = useNavigate();

  const handleTabClick = (tabId: string) => {
    if (onTabChange) {
      onTabChange(tabId);
    } else if (basePath) {
      navigate(`${basePath}/${tabId}`);
    }
  };

  return (
    <header className="fixed top-0 inset-x-0 z-40 pointer-events-none">
      <div className="max-w-lg mx-auto pointer-events-auto bg-white/95 dark:bg-surface-950/95 backdrop-blur-md border-b border-surface-100 dark:border-surface-800">
        <div className="px-5 pt-8 pb-4">
          <HorizontalScroll 
            containerClassName="flex items-center gap-6 pb-3"
            scrollAmount={200}
            fadeEdges={false}
          >
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabClick(tab.id)}
                className={cn(
                  "text-xl font-medium transition-colors relative whitespace-nowrap flex-shrink-0",
                  activeTab === tab.id 
                    ? "text-surface-900 dark:text-white" 
                    : "text-surface-300 dark:text-surface-700"
                )}
              >
                {tab.label}
                {activeTab === tab.id && (
                  <div className="absolute -bottom-2 left-0 right-0 h-1 bg-surface-900 dark:bg-white rounded-full" />
                )}
              </button>
            ))}
          </HorizontalScroll>
        </div>
      </div>
    </header>
  );
}
