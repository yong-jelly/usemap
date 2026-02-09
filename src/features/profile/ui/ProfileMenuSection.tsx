import { useNavigate } from "react-router";
import { 
  Clock, 
  Heart, 
  Bookmark, 
  MapPin, 
  MessageSquare, 
  UserPlus, 
  Users, 
  PieChart, 
  ChevronRight
} from "lucide-react";
import { trackEvent } from "@/shared/lib/gtm";
import { cn } from "@/shared/lib/utils";

interface MenuItemProps {
  icon: React.ElementType;
  label: string;
  onClick: () => void;
  isDestructive?: boolean;
}

function MenuItem({ icon: Icon, label, onClick, isDestructive }: MenuItemProps) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center justify-between py-4 px-5 hover:bg-surface-50 dark:hover:bg-surface-800/50"
    >
      <div className="flex items-center gap-3">
        <Icon className={cn(
          "h-5 w-5",
          isDestructive ? "text-red-500" : "text-surface-400 dark:text-surface-500"
        )} />
        <span className={cn(
          "text-[16px] font-medium",
          isDestructive ? "text-red-500" : "text-surface-900 dark:text-white"
        )}>
          {label}
        </span>
      </div>
      <ChevronRight className="h-5 w-5 text-surface-300 dark:text-surface-600" />
    </button>
  );
}

export function ProfileMenuSection() {
  const navigate = useNavigate();

  const handleNavigation = (path: string, eventName: string) => {
    trackEvent(eventName, { location: "profile_menu" });
    navigate(path);
  };

  return (
    <div className="flex flex-col divide-y divide-surface-100 dark:divide-surface-800 border-t border-b border-surface-100 dark:border-surface-800 bg-white dark:bg-neutral-900">
      <MenuItem 
        icon={Clock} 
        label="최근" 
        onClick={() => handleNavigation("/profile/recent", "click_recent")} 
      />
      <MenuItem 
        icon={Heart} 
        label="좋아요" 
        onClick={() => handleNavigation("/profile/liked", "click_liked")} 
      />
      <MenuItem 
        icon={Bookmark} 
        label="저장" 
        onClick={() => handleNavigation("/profile/saved", "click_saved")} 
      />
      <MenuItem 
        icon={MapPin} 
        label="방문" 
        onClick={() => handleNavigation("/profile/visited", "click_visited")} 
      />
      <MenuItem 
        icon={MessageSquare} 
        label="내 리뷰" 
        onClick={() => handleNavigation("/profile/reviews", "click_reviews")} 
      />
      <MenuItem 
        icon={UserPlus} 
        label="구독" 
        onClick={() => handleNavigation("/profile/subscription", "click_subscription")} 
      />
      <MenuItem 
        icon={Users} 
        label="구독자" 
        onClick={() => handleNavigation("/profile/subscribers", "click_subscribers")} 
      />
      <MenuItem 
        icon={PieChart} 
        label="분석" 
        onClick={() => handleNavigation("/profile/analysis", "click_analysis")} 
      />
    </div>
  );
}
