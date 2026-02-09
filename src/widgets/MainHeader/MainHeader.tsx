import { useNavigate } from "react-router";
import { Search, CircleUser } from "lucide-react";
import { useUserStore } from "@/entities/user";
import { useAuthModalStore } from "@/features/auth/model/useAuthModalStore";
import { PageHeader, TabItem } from "@/shared/ui/PageHeader";
import { ReactNode } from "react";
import { cn } from "@/shared/lib/utils";

interface MainHeaderProps {
  tabs: TabItem[];
  activeTab: string;
  onTabChange?: (tabId: string) => void;
  basePath?: string;
  title?: ReactNode;
  actions?: ReactNode;
}

export function MainHeader({ 
  tabs, 
  activeTab, 
  onTabChange, 
  basePath, 
  title, 
  actions 
}: MainHeaderProps) {
  const navigate = useNavigate();
  const { isAuthenticated, profile } = useUserStore();
  const { openLogin } = useAuthModalStore();

  const handleProfileClick = () => {
    if (!isAuthenticated) {
      openLogin();
      return;
    }
    navigate("/profile");
  };

  const searchButton = (
    <button 
      onClick={() => navigate("/search")}
      className="p-1 text-surface-500 dark:text-surface-400 focus:outline-none"
    >
      <Search className="size-6" />
    </button>
  );

  const profileButton = (
    <button 
      onClick={handleProfileClick}
      className={cn(
        "p-1 focus:outline-none",
        isAuthenticated 
          ? "text-surface-900 dark:text-white" 
          : "text-surface-500 dark:text-surface-400"
      )}
    >
      {isAuthenticated && profile?.profile_image_url ? (
        <div className="size-8 rounded-full ring-2 ring-surface-200 dark:ring-surface-700 overflow-hidden">
          <img 
            src={profile.profile_image_url} 
            alt="프로필" 
            className="w-full h-full object-cover"
          />
        </div>
      ) : (
        <CircleUser className="size-7" />
      )}
    </button>
  );

  const resolvedActions = actions ? (
    <>
      {searchButton}
      {actions}
      {profileButton}
    </>
  ) : (
    <>
      {searchButton}
      {profileButton}
    </>
  );

  return (
    <PageHeader 
      tabs={tabs} 
      activeTab={activeTab} 
      onTabChange={onTabChange}
      basePath={basePath}
      title={title}
      actions={resolvedActions}
    />
  );
}
