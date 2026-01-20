import React from 'react';
import { useNavigate } from 'react-router';
import { cn } from "@/shared/lib/utils";

interface PlaceFeatureTagsProps {
  place: any;
  isFoldersExpanded?: boolean;
  onFoldersToggle?: (e: React.MouseEvent) => void;
  onFolderClick?: (e: React.MouseEvent, folder: any) => void;
  className?: string;
  showCategory?: boolean;
  showKeywords?: boolean;
}

/**
 * 장소의 특징(카테고리, 키워드, 커뮤니티 언급, 폴더)을 태그 형태로 표시하는 공용 컴포넌트
 */
export function PlaceFeatureTags({
  place,
  isFoldersExpanded = false,
  onFoldersToggle,
  onFolderClick,
  className,
  showCategory = true,
  showKeywords = true
}: PlaceFeatureTagsProps) {
  const navigate = useNavigate();
  const folders = (place.features || []).filter((f: any) => f.platform_type === "folder");

  // 커뮤니티 통계 계산
  const communityCounts = (place.features || []).reduce((acc: Record<string, number>, f: any) => {
    if (f.platform_type === "youtube") {
      acc.youtube = (acc.youtube || 0) + 1;
    } else if (f.platform_type === "community") {
      const url = f.content_url || "";
      if (url.includes("clien.net")) acc.clien = (acc.clien || 0) + 1;
      else if (url.includes("damoang.net")) acc.damoang = (acc.damoang || 0) + 1;
      else if (url.includes("bobaedream.co.kr")) acc.bobaedream = (acc.bobaedream || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);

  const communities = [
    { id: 'clien', name: '클리앙', count: communityCounts.clien },
    { id: 'youtube', name: '유튜브', count: communityCounts.youtube },
    { id: 'damoang', name: '다모앙', count: communityCounts.damoang },
    { id: 'bobaedream', name: '보배드림', count: communityCounts.bobaedream },
  ].filter(c => c.count && c.count > 0);

  const defaultHandleFolderClick = (e: React.MouseEvent, folder: any) => {
    e.stopPropagation();
    if (folder.platform_type === "folder" && folder.metadata?.channelId) {
      navigate(`/feature/detail/folder/${folder.metadata.channelId}`);
    } else {
      navigate(`/feature/detail/folder/${folder.id}`);
    }
  };

  const handleFolderClickAction = onFolderClick || defaultHandleFolderClick;

  return (
    <div className={cn("flex flex-wrap gap-1.5", className)}>
      {showCategory && place.category && (
        <span className="text-[12px] font-medium text-primary-500 bg-primary-50 px-2 py-0.5 rounded">
          #{place.category}
        </span>
      )}
      
      {showKeywords && place.keyword_list?.slice(0, 3).map((tag: string, i: number) => (
        <span key={i} className="text-[12px] font-medium text-blue-500 bg-blue-50 px-2 py-0.5 rounded">
          #{tag}
        </span>
      ))}

      {/* 커뮤니티 태그 표시 - 폴더 좌측 배치, # 추가, 숫자 제외 */}
      {communities.map((community) => (
        <span 
          key={community.id}
          className="text-[12px] font-medium text-surface-500 dark:text-surface-400 bg-surface-100 dark:bg-surface-800/50 px-2 py-0.5 rounded"
        >
          #{community.name}
        </span>
      ))}

      {/* 폴더 표시 */}
      {folders.length > 0 && (
        <>
          {isFoldersExpanded || folders.length === 1 || !onFoldersToggle ? (
            folders.map((folder: any, i: number) => (
              <button
                key={folder.id || i}
                onClick={(e) => handleFolderClickAction(e, folder)}
                className="text-[12px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-0.5 rounded hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition-colors"
              >
                {folder.title || `폴더 ${i + 1}`}
              </button>
            ))
          ) : (
            <button
              onClick={onFoldersToggle}
              className="text-[12px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-0.5 rounded hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition-colors"
            >
              {folders[0]?.title || '폴더 1'}
              {folders.length > 1 && (
                <span className="ml-1 text-emerald-500">+{folders.length - 1}</span>
              )}
            </button>
          )}
        </>
      )}
    </div>
  );
}
