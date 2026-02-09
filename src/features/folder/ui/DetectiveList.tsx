import { useRef, useEffect } from "react";
import { usePublicFolders } from "@/entities/folder/queries";
import { FolderCard } from "./FolderCard";
import { DetectiveListHeader } from "./DetectiveListHeader";
import { Loader2 } from "lucide-react";

export function DetectiveList() {
  const { 
    data: publicFoldersData, 
    fetchNextPage, 
    hasNextPage, 
    isFetchingNextPage, 
    isLoading: isPublicLoading 
  } = usePublicFolders();

  const observerTarget = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!hasNextPage || isFetchingNextPage) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          fetchNextPage();
        }
      },
      { threshold: 0, rootMargin: '200px' }
    );

    const currentTarget = observerTarget.current;
    if (currentTarget) observer.observe(currentTarget);

    return () => {
      if (currentTarget) observer.unobserve(currentTarget);
    };
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const publicFolders = (publicFoldersData?.pages.flatMap((page) => page) || []).filter(
    (folder) => folder.place_count > 0
  );

  if (isPublicLoading) {
    return (
      <div className="flex justify-center p-12">
        <Loader2 className="size-8 text-surface-300 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 py-1">
      {/* 공개 폴더 섹션 */}
      <div className="flex flex-col gap-4">
        <DetectiveListHeader />
        <div className="flex flex-col">
          {publicFolders.map((folder) => (
            <FolderCard key={folder.id} folder={folder} showOwner={true} />
          ))}
        </div>
      </div>

      {hasNextPage && (
        <div ref={observerTarget} className="p-12 flex justify-center">
          <Loader2 className="size-6 text-surface-300 animate-spin" />
        </div>
      )}
    </div>
  );
}
