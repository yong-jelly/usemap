import { useNavigate } from "react-router";
import { useMyFolders } from "@/entities/folder/queries";
import { HorizontalScroll } from "@/shared/ui/HorizontalScroll";
import { convertToNaverResizeImageUrl } from "@/shared/lib";
import { Folder } from "lucide-react";

export function FolderCardList() {
  const navigate = useNavigate();
  const { data: folders, isLoading } = useMyFolders();

  if (isLoading) {
    return (
      <div className="flex gap-3 px-5 overflow-hidden">
        {[1, 2, 3].map((i) => (
          <div key={i} className="w-[160px] h-[80px] bg-surface-100 dark:bg-surface-800 rounded-xl animate-pulse shrink-0" />
        ))}
      </div>
    );
  }

  if (!folders || folders.length === 0) {
    return (
      <div className="px-5 py-4 text-center">
        <p className="text-sm text-surface-500 mb-3">아직 만든 맛탐정 폴더가 없습니다.</p>
        <button 
          onClick={() => navigate("/folder/create")}
          className="text-sm font-medium text-primary-600 hover:text-primary-700"
        >
          + 첫 폴더 만들기
        </button>
      </div>
    );
  }

  return (
    <HorizontalScroll 
      containerClassName="flex gap-3 px-5 pb-4"
      scrollAmount={200}
      style={{ 
        willChange: 'scroll-position',
        WebkitOverflowScrolling: 'touch',
        transform: 'translateZ(0)',
      }}
    >
      {folders.map((folder) => {
        const hasThumbnail = !!folder.thumbnail_url;
        return (
          <button
            key={folder.id}
            onClick={() => navigate(`/folder/${folder.id}`)}
            className="flex w-[160px] h-[80px] rounded-xl bg-white dark:bg-surface-900 border border-surface-100 dark:border-surface-800 shrink-0 overflow-hidden group"
          >
            <div className="w-20 h-full flex-shrink-0 bg-surface-100 dark:bg-surface-800 overflow-hidden">
              {hasThumbnail ? (
                <img
                  src={convertToNaverResizeImageUrl(folder.thumbnail_url!)}
                  alt=""
                  className="w-full h-full object-cover"
                  loading="lazy"
                  decoding="async"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Folder className="size-8 text-surface-400" />
                </div>
              )}
            </div>
            <div className="flex-1 flex flex-col justify-center p-3 min-w-0 text-left">
              <h3 className="text-sm font-medium text-surface-900 dark:text-white truncate mb-0.5">
                {folder.title}
              </h3>
              <p className="text-xs text-surface-500 dark:text-surface-400">
                장소 {folder.place_count}개
              </p>
            </div>
          </button>
        );
      })}
    </HorizontalScroll>
  );
}
