import React, { useState } from "react";
import { Drawer, DrawerContent } from "@/shared/ui/Drawer";
import {
  FolderPlus,
  Folder,
  Check,
  Plus,
  Loader2,
  ChevronRight,
  Users,
  X,
  Bookmark,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import {
  folderKeys,
  useAddPlaceToFolder,
  useRemovePlaceFromFolder,
  useCreateFolder,
} from "@/entities/folder/queries";
import { folderApi } from "@/entities/folder/api";
import { Input } from "@/shared/ui";
import { cn } from "@/shared/lib/utils";
import { convertToNaverResizeImageUrl } from "@/shared/lib";
import { toast } from "sonner";
import type { Folder as FolderType } from "@/entities/folder/types";

const PERMISSION_LABEL: Record<string, string> = {
  public: "공개",
  private: "비공개",
  hidden: "링크 공유",
  invite: "초대 전용",
  default: "비공개",
};

interface SaveToCollectionSheetProps {
  isOpen: boolean;
  onClose: () => void;
  placeId: string;
  placeName: string;
  placeThumbnail?: string;
  isPlaceSaved?: boolean;
}

function getFolderThumbnail(folder: FolderType, placeThumbnail?: string): string | null {
  if (folder.permission === "default" && placeThumbnail) return placeThumbnail;
  if (folder.thumbnail_url) return folder.thumbnail_url;
  const first = folder.preview_places?.[0];
  if (!first) return null;
  const img =
    first.thumbnail ||
    (first as any).images?.[0] ||
    (first as any).image_urls?.[0] ||
    (first as any).place_images?.[0];
  return img || null;
}

export function SaveToCollectionSheet({
  isOpen,
  onClose,
  placeId,
  placeName: _placeName,
  placeThumbnail,
  isPlaceSaved = false,
}: SaveToCollectionSheetProps) {
  const { data: folders = [], isLoading } = useQuery({
    queryKey: [...folderKeys.list("my"), placeId],
    queryFn: () => folderApi.listMyFolders({ placeId }),
    enabled: isOpen,
  });
  const addPlaceMutation = useAddPlaceToFolder();
  const removePlaceMutation = useRemovePlaceFromFolder();
  const createFolderMutation = useCreateFolder();

  const [optimisticSelected, setOptimisticSelected] = useState<Record<string, boolean>>({});
  const [showCreateSheet, setShowCreateSheet] = useState(false);
  const [newFolderTitle, setNewFolderTitle] = useState("");

  const defaultFolder = folders.find((f) => f.permission === "default");
  const customFolders = folders.filter((f) => f.permission !== "default");

  const getIsSelected = (folderId: string, isDefault = false) => {
    if (optimisticSelected[folderId] !== undefined) return optimisticSelected[folderId];
    const folder = folders.find((f) => f.id === folderId);
    if (isDefault && isPlaceSaved) return true;
    return folder?.is_place_in_folder ?? false;
  };

  const handleToggleFolder = (folderId: string) => {
    const isSelected = getIsSelected(folderId);
    const folder = folders.find((f) => f.id === folderId);
    const folderTitle = folder?.title ?? "컬렉션";

    setOptimisticSelected((prev) => ({ ...prev, [folderId]: !isSelected }));

    if (isSelected) {
      removePlaceMutation.mutate(
        { folderId, placeId },
        {
          onError: () => {
            setOptimisticSelected((prev) => ({ ...prev, [folderId]: true }));
            toast.error("저장 해제에 실패했습니다. 다시 시도해주세요.");
          },
        }
      );
    } else {
      addPlaceMutation.mutate(
        { folderId, placeId },
        {
          onSuccess: () => {
            toast.success(`${folderTitle}에 저장됨`);
          },
          onError: () => {
            setOptimisticSelected((prev) => ({ ...prev, [folderId]: false }));
            toast.error("저장에 실패했습니다. 다시 시도해주세요.");
          },
        }
      );
    }
  };

  const handleCreateFolder = () => {
    const title = newFolderTitle.trim();
    if (!title || title.length > 20) return;

    createFolderMutation.mutate(
      {
        title,
        permission: "private",
        permissionWriteType: 0,
      },
      {
        onSuccess: (data) => {
          if (data?.id) {
            setNewFolderTitle("");
            setShowCreateSheet(false);
            addPlaceMutation.mutate(
              { folderId: data.id, placeId },
              {
                onSuccess: () => {
                  toast.success(`${title}에 저장됨`);
                },
                onError: () => {
                  toast.error("저장에 실패했습니다. 다시 시도해주세요.");
                },
              }
            );
          }
        },
        onError: () => {
          toast.error("컬렉션 생성에 실패했습니다. 다시 시도해주세요.");
        },
      }
    );
  };

  const handleCreateInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleCreateFolder();
    }
  };

  const renderFolderRow = (folder: FolderType, isDefault = false) => {
    const isSelected = getIsSelected(folder.id, isDefault);
    const thumb = getFolderThumbnail(folder, isDefault ? placeThumbnail : undefined);
    const permLabel = PERMISSION_LABEL[folder.permission] || "비공개";
    const isCollaborative = folder.permission_write_type === 1;

    return (
      <button
        key={folder.id}
        type="button"
        onClick={() => handleToggleFolder(folder.id)}
        className={cn(
          "flex items-center gap-4 px-4 py-4 min-h-[76px] w-full text-left active:opacity-60 transition-colors",
          isDefault
            ? "bg-surface-100 dark:bg-surface-900 rounded-2xl mb-4"
            : isSelected && "bg-surface-50 dark:bg-surface-900/50"
        )}
      >
        <div className="size-[52px] rounded-2xl flex-shrink-0 overflow-hidden bg-surface-200 dark:bg-surface-800">
          {thumb ? (
            <img
              src={convertToNaverResizeImageUrl(thumb)}
              alt=""
              className="w-full h-full object-cover"
              loading="lazy"
              decoding="async"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Folder className="size-7 text-surface-400" />
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p
            className={cn(
              "text-[17px] font-semibold truncate",
              isSelected
                ? "text-primary-700 dark:text-primary-300"
                : "text-surface-900 dark:text-white"
            )}
          >
            {isDefault ? "저장됨" : folder.title}
          </p>
          <p className="text-[13px] text-surface-500 mt-0.5 truncate">
            {isCollaborative ? "공동 작업자" : permLabel}
            {!isDefault && ` · 장소 ${folder.place_count.toLocaleString()}개`}
          </p>
        </div>
        <div
          className={cn(
            "size-11 rounded-full flex items-center justify-center flex-shrink-0 transition-all",
            isSelected
              ? "bg-primary-600"
              : "border-2 border-surface-300 dark:border-surface-600"
          )}
        >
          {isSelected ? (
            isDefault ? (
              <Bookmark className="size-5 text-white fill-white" />
            ) : (
              <Check className="size-5 text-white stroke-[3]" />
            )
          ) : (
            <Plus className="size-5 text-surface-500" />
          )}
        </div>
      </button>
    );
  };

  if (showCreateSheet) {
    return (
      <Drawer
        open={isOpen}
        onOpenChange={(open) => {
          if (!open) {
            if (showCreateSheet) setShowCreateSheet(false);
            else onClose();
          }
        }}
      >
        <DrawerContent className="h-[85vh] flex flex-col bg-white dark:bg-surface-950 border-surface-200 dark:border-surface-800 outline-none rounded-t-[28px] shadow-2xl max-w-lg mx-auto">
          <header className="flex items-center justify-between px-4 py-4 shrink-0">
            <button
              type="button"
              onClick={() => setShowCreateSheet(false)}
              className="text-[15px] font-medium text-surface-600 dark:text-surface-400 active:opacity-60"
            >
              취소
            </button>
            <h2 className="text-[15px] font-bold text-surface-900 dark:text-white">
              새 컬렉션
            </h2>
            <button
              type="button"
              onClick={handleCreateFolder}
              disabled={
                !newFolderTitle.trim() ||
                newFolderTitle.length > 20 ||
                createFolderMutation.isPending
              }
              className="text-[15px] font-bold text-primary-600 dark:text-primary-400 disabled:opacity-40 active:opacity-60"
            >
              {createFolderMutation.isPending ? (
                <Loader2 className="size-5 animate-spin" />
              ) : (
                "저장"
              )}
            </button>
          </header>

          <div
            className="flex-1 overflow-y-auto min-h-0 overscroll-contain px-4 py-4"
            style={{
              willChange: "scroll-position",
              WebkitOverflowScrolling: "touch",
              transform: "translateZ(0)",
            }}
          >
            {placeThumbnail && (
              <div className="w-full aspect-square max-w-[280px] mx-auto rounded-2xl overflow-hidden bg-surface-100 dark:bg-surface-800 mb-6">
                <img
                  src={convertToNaverResizeImageUrl(placeThumbnail)}
                  alt=""
                  className="w-full h-full object-cover"
                  loading="lazy"
                  decoding="async"
                />
              </div>
            )}
            <div className="flex flex-col gap-4">
              <div className="relative">
                <Input
                  value={newFolderTitle}
                  onChange={(e) => setNewFolderTitle(e.target.value)}
                  onKeyDown={handleCreateInputKeyDown}
                  placeholder="컬렉션 이름"
                  maxLength={20}
                  autoFocus
                  className="w-full h-12 pl-4 pr-12 text-[15px] rounded-xl bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-700"
                />
                {newFolderTitle && (
                  <button
                    type="button"
                    onClick={() => setNewFolderTitle("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full bg-surface-200 dark:bg-surface-700 active:opacity-60"
                  >
                    <X className="size-4 text-surface-600 dark:text-surface-400" />
                  </button>
                )}
              </div>
              <div className="flex justify-end">
                <span
                  className={cn(
                    "text-[12px] font-medium",
                    newFolderTitle.length > 20 ? "text-rose-500" : "text-surface-400"
                  )}
                >
                  {newFolderTitle.length}/20
                </span>
              </div>

              <button
                type="button"
                className="flex items-center gap-3 w-full py-4 px-4 rounded-xl bg-surface-50 dark:bg-surface-900 border border-surface-100 dark:border-surface-800 active:opacity-60"
              >
                <div className="size-10 rounded-xl flex items-center justify-center bg-surface-200 dark:bg-surface-800">
                  <Users className="size-5 text-surface-500" />
                </div>
                <div className="flex-1 text-left">
                  <p className="text-[15px] font-medium text-surface-900 dark:text-white">
                    컬렉션에 사람 추가
                  </p>
                  <p className="text-[12px] text-surface-500 mt-0.5">
                    함께 컬렉션에 저장해보세요
                  </p>
                </div>
                <ChevronRight className="size-5 text-surface-400" />
              </button>
            </div>
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Drawer open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DrawerContent className="h-[70vh] flex flex-col bg-white dark:bg-surface-950 border-surface-200 dark:border-surface-800 outline-none rounded-t-[28px] shadow-2xl max-w-lg mx-auto">
        <div
          className="flex-1 overflow-y-auto min-h-0 overscroll-contain px-4 pt-4 pb-6"
          style={{
            willChange: "scroll-position",
            WebkitOverflowScrolling: "touch",
            transform: "translateZ(0)",
          }}
        >
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="size-8 animate-spin text-primary-500" />
              <span className="text-sm font-medium text-surface-400 mt-3">
                폴더 목록 불러오는 중...
              </span>
            </div>
          ) : (
            <div className="flex flex-col">
              {defaultFolder ? (
                renderFolderRow(defaultFolder, true)
              ) : (
                isPlaceSaved &&
                placeThumbnail && (
                  <div className="flex items-center gap-4 px-4 py-4 min-h-[76px] w-full bg-surface-100 dark:bg-surface-900 rounded-2xl mb-4">
                    <div className="size-[52px] rounded-2xl flex-shrink-0 overflow-hidden bg-surface-200 dark:bg-surface-800">
                      <img
                        src={convertToNaverResizeImageUrl(placeThumbnail)}
                        alt=""
                        className="w-full h-full object-cover"
                        loading="lazy"
                        decoding="async"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[17px] font-semibold text-surface-900 dark:text-white">
                        저장됨
                      </p>
                      <p className="text-[13px] text-surface-500 mt-0.5">
                        비공개
                      </p>
                    </div>
                    <div className="size-11 rounded-full flex items-center justify-center flex-shrink-0 bg-primary-600">
                      <Bookmark className="size-5 text-white fill-white" />
                    </div>
                  </div>
                )
              )}

              <div className="flex items-center justify-between px-1 mt-2 mb-3">
                <h3 className="text-[17px] font-semibold text-surface-900 dark:text-white">
                  컬렉션
                </h3>
                <button
                  type="button"
                  onClick={() => setShowCreateSheet(true)}
                  className="text-[16px] font-medium text-primary-600 dark:text-primary-400 active:opacity-60"
                >
                  새 컬렉션
                </button>
              </div>

              {customFolders.length > 0 ? (
                <div className="flex flex-col gap-0">
                  {customFolders.map((folder) => renderFolderRow(folder))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-surface-400">
                  <Folder className="size-12 opacity-20 mb-3" />
                  <p className="text-[14px] font-medium text-surface-500">
                    아직 컬렉션이 없어요
                  </p>
                  <button
                    type="button"
                    onClick={() => setShowCreateSheet(true)}
                    className="mt-3 text-[14px] font-medium text-primary-600 dark:text-primary-400 active:opacity-60"
                  >
                    새 컬렉션 만들기
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
