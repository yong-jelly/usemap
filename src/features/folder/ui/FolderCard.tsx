import { useNavigate } from "react-router";
import { Folder } from "@/entities/folder/types";
import { PlaceSlider, Button } from "@/shared/ui";
import { usePlacePopup } from "@/shared/lib/place-popup";
import { User, Users, Heart } from "lucide-react";
import { useToggleFolderSubscription, useMySubscriptions } from "@/entities/folder/queries";
import { useUserStore } from "@/entities/user";
import { useAuthModalStore } from "@/features/auth/model/useAuthModalStore";
import { cn } from "@/shared/lib/utils";

interface FolderCardProps {
  folder: Folder;
}

export function FolderCard({ folder }: FolderCardProps) {
  const navigate = useNavigate();
  const { show: showPlaceModal } = usePlacePopup();
  const { isAuthenticated, user } = useUserStore();
  const { openLogin } = useAuthModalStore();
  
  const { data: mySubscriptions } = useMySubscriptions();
  const { mutate: toggleSubscription } = useToggleFolderSubscription();

  const isOwner = folder.owner_id === user?.id;
  const isSubscribed = mySubscriptions?.some(
    (sub: any) => sub.subscription_type === 'folder' && sub.feature_id === folder.id
  );

  const handleSubscribe = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isAuthenticated) {
      openLogin();
      return;
    }
    toggleSubscription(folder.id);
  };

  return (
    <section className="flex flex-col gap-2 px-4 py-2">
      {/* 제목 영역: 타이틀 + 개수 */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-col gap-1 overflow-hidden">
          <div className="flex items-center gap-1.5 overflow-hidden">
            <h3 
              className="text-xl font-black text-surface-900 dark:text-white leading-tight break-keep cursor-pointer hover:underline underline-offset-4 truncate"
              onClick={() => navigate(`/folder/${folder.id}`)}
            >
              {folder.title}
            </h3>
            {folder.permission === 'public' ? (
              <Users className="size-4 text-surface-400 flex-shrink-0" />
            ) : (
              <User className="size-4 text-surface-400 flex-shrink-0" />
            )}
          </div>
          {folder.description && (
            <p className="text-sm text-surface-500 line-clamp-1">{folder.description}</p>
          )}
        </div>
        
        {!isOwner && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleSubscribe}
            className={cn(
              "flex-shrink-0 rounded-full h-8 gap-1.5 font-bold transition-all",
              isSubscribed 
                ? "bg-primary-50 border-primary-200 text-primary-600 dark:bg-primary-900/20 dark:border-primary-800" 
                : "border-surface-200 dark:border-surface-700"
            )}
          >
            <Heart className={cn("size-3.5", isSubscribed && "fill-primary-500 text-primary-500")} />
            {isSubscribed ? "구독중" : "구독"}
          </Button>
        )}
      </div>

      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-surface-400 font-medium">
          {folder.owner_nickname || '익명'}
        </span>
        <span className="text-sm font-medium text-surface-400 whitespace-nowrap">
          {folder.place_count}개 매장
        </span>
      </div>

      {/* 장소 슬라이더 */}
      <div className="-mx-4">
        <PlaceSlider
          title=""
          items={folder.preview_places || []}
          onItemClick={showPlaceModal}
          onMoreClick={() => navigate(`/folder/${folder.id}`)}
          showMoreThreshold={5}
          showRating={false}
          snap={false}
        />
      </div>
    </section>
  );
}
