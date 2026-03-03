import React from 'react';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/shared/ui/Drawer';
import { 
  MessageSquareText, 
  MapPinCheck, 
  PlusCircle,
  ChevronRight
} from 'lucide-react';
import { cn } from '@/shared/lib/utils';

interface PlaceActionSheetProps {
  isOpen: boolean;
  onClose: () => void;
  placeName: string;
  onAddReview: () => void;
  onAddVisit: () => void;
  onAddContent: () => void;
}

export function PlaceActionSheet({ 
  isOpen, 
  onClose, 
  placeName,
  onAddReview,
  onAddVisit,
  onAddContent
}: PlaceActionSheetProps) {
  const actions = [
    {
      id: 'review',
      title: '리뷰 쓰기',
      description: '이 장소에 대한 솔직한 리뷰를 남겨보세요',
      icon: <MessageSquareText className="size-6 text-amber-500" />,
      onClick: () => {
        onAddReview();
        onClose();
      }
    },
    {
      id: 'visit',
      title: '다녀왔어요',
      description: '방문 기록을 남기고 나만의 지도를 완성하세요',
      icon: <MapPinCheck className="size-6 text-primary-500" />,
      onClick: () => {
        onAddVisit();
        onClose();
      }
    },
    {
      id: 'content',
      title: '관련 콘텐츠 추가',
      description: '유튜브, 커뮤니티 등 관련 링크를 공유해주세요',
      icon: <PlusCircle className="size-6 text-rose-500" />,
      onClick: () => {
        onAddContent();
        onClose();
      }
    }
  ];

  return (
    <Drawer open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DrawerContent className="pb-safe bg-white dark:bg-surface-950 border-surface-200 dark:border-surface-800 outline-none rounded-t-[28px] shadow-2xl max-w-lg mx-auto">
        <DrawerHeader className="relative flex flex-col items-center justify-center pb-4 border-b border-surface-100 dark:border-surface-800 shrink-0">
          <div className="w-12 h-1.5 bg-surface-200 dark:bg-surface-800 rounded-full mb-4" />
          <DrawerTitle className="text-[17px] font-bold text-surface-900 dark:text-white">
            {placeName}
          </DrawerTitle>
        </DrawerHeader>

        <div className="px-4 py-4 flex flex-col gap-3">
          {actions.map((action) => (
            <button
              key={action.id}
              onClick={action.onClick}
              className={cn(
                "flex items-center gap-4 p-4 rounded-2xl transition-all active:scale-[0.98]",
                "bg-surface-50 dark:bg-surface-900/50 border border-surface-100 dark:border-surface-800",
                "hover:bg-surface-100 dark:hover:bg-surface-800"
              )}
            >
              <div className="size-12 rounded-xl bg-white dark:bg-surface-800 flex items-center justify-center shadow-sm">
                {action.icon}
              </div>
              <div className="flex-1 text-left">
                <div className="text-[15px] font-bold text-surface-900 dark:text-white">
                  {action.title}
                </div>
                <div className="text-[12px] text-surface-500 dark:text-surface-400 mt-0.5">
                  {action.description}
                </div>
              </div>
              <ChevronRight className="size-5 text-surface-300" />
            </button>
          ))}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
