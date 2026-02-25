import React, { useState, useRef } from 'react';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/shared/ui/Drawer';
import { X, Heart, MessageCircle } from 'lucide-react';
import {
  usePlaceComments,
  useCreatePlaceComment,
  useDeletePlaceComment,
  useTogglePlaceCommentLike,
} from '@/entities/place/queries';
import { useUserProfile } from '@/entities/user/queries';
import { formatDistanceToNowStrict } from 'date-fns';
import { ko } from 'date-fns/locale';
import { cn } from '@/shared/lib/utils';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/shared/ui/Dialog';
import { Button } from '@/shared/ui/Button';

// 짧은 시간 포맷팅 (예: 5분 전 -> 5분)
const formatShortTime = (dateString: string) => {
  const distance = formatDistanceToNowStrict(new Date(dateString), { locale: ko });
  return distance.replace(' 전', '').replace(' 시간', '시간').replace(' 분', '분').replace(' 일', '일').replace(' 개월', '개월').replace(' 년', '년');
};

export type PlaceComment = {
  id: string;
  user_id: string | null;
  content: string;
  created_at: string;
  like_count: number;
  is_liked: boolean;
  is_tombstoned?: boolean;
  user_profile: {
    nickname: string;
    profile_image_url: string | null;
    status?: 'active' | 'deactivated' | 'deleted';
  };
  replies: PlaceComment[];
};

const MAX_LENGTH = 150;

interface PlaceCommentSheetProps {
  isOpen: boolean;
  onClose: () => void;
  placeId: string;
  placeName: string;
}

export function PlaceCommentSheet({ isOpen, onClose, placeId, placeName: _placeName }: PlaceCommentSheetProps) {
  const { data: comments = [], isLoading } = usePlaceComments(placeId, { enabled: isOpen });
  const { data: profile } = useUserProfile();
  const createComment = useCreatePlaceComment(placeId);
  const deleteComment = useDeletePlaceComment(placeId);
  const toggleLike = useTogglePlaceCommentLike(placeId);

  const [comment, setComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<{ id: string; nickname: string; commentLevel: number } | null>(null);
  const [expandedReplies, setExpandedReplies] = useState<Record<string, boolean>>({});
  const [optimisticLikes, setOptimisticLikes] = useState<Record<string, { like_count: number; is_liked: boolean }>>({});
  const inputRef = useRef<HTMLInputElement>(null);

  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; isReply: boolean; parentId?: string } | null>(null);

  const currentUserId = profile?.auth_user_id ?? null;

  const handleReplyClick = (commentId: string, nickname: string, commentLevel: number) => {
    setReplyingTo({ id: commentId, nickname, commentLevel });
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  };

  const getCommentLikeState = (item: PlaceComment, _depth: number, _parentId?: string) => {
    const key = item.id;
    const opt = optimisticLikes[key];
    if (opt) return opt;
    return { like_count: item.like_count, is_liked: item.is_liked };
  };

  const handleToggleLike = (item: PlaceComment, _depth = 0, _parentId?: string) => {
    if (item.is_tombstoned) return;

    setOptimisticLikes(prev => {
      const key = item.id;
      const current = prev[key] ?? { like_count: item.like_count, is_liked: item.is_liked };
      const next = {
        like_count: current.is_liked ? Math.max(0, current.like_count - 1) : current.like_count + 1,
        is_liked: !current.is_liked,
      };
      return { ...prev, [key]: next };
    });

    toggleLike.mutate(item.id, {
      onError: () => {
        setOptimisticLikes(prev => {
          const { [item.id]: _, ...rest } = prev;
          return rest;
        });
      },
    });
  };

  const executeDelete = () => {
    if (!deleteConfirm) return;

    const { id: commentId } = deleteConfirm;
    deleteComment.mutate(commentId, {
      onSettled: () => setDeleteConfirm(null),
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim() || comment.length > MAX_LENGTH) return;

    const content = comment.trim();
    const parentId = replyingTo?.id ?? null;
    const commentLevel = replyingTo?.commentLevel ?? 0;

    createComment.mutate(
      {
        content,
        parentCommentId: parentId,
        commentLevel,
      },
      {
        onSuccess: () => {
          setComment('');
          setReplyingTo(null);
          if (parentId) {
            setExpandedReplies(prev => ({ ...prev, [parentId]: true }));
          }
        },
      }
    );
  };

  const renderComment = (item: PlaceComment, depth = 0, parentId?: string) => {
    const isDeactivated = item.user_profile?.status === 'deactivated' || item.user_profile?.status === 'deleted';
    const likeState = getCommentLikeState(item, depth, parentId);
    const isMyComment = !item.is_tombstoned && currentUserId && String(item.user_id) === String(currentUserId);

    const isReply = depth > 0;
    const canReply = depth < 2;

    return (
      <div key={item.id} className={cn('flex gap-3 w-full', isReply ? 'mt-3' : 'mt-5')}>
        <div
          className={cn(
            'rounded-full bg-surface-200 dark:bg-surface-800 overflow-hidden flex-shrink-0',
            isReply ? 'size-6' : 'size-9'
          )}
        >
          {item.user_profile?.profile_image_url && !item.is_tombstoned && !isDeactivated ? (
            <img
              src={item.user_profile.profile_image_url}
              alt="profile"
              className="w-full h-full object-cover"
              loading="lazy"
              decoding="async"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-[10px] text-surface-500">
              {item.is_tombstoned || isDeactivated ? '?' : (item.user_profile?.nickname?.slice(0, 1) || '?')}
            </div>
          )}
        </div>
        <div className="flex-1 flex flex-col min-w-0">
          <div className="text-[13px] leading-[1.4] text-surface-900 dark:text-white break-words">
            <span
              className={cn(
                'font-semibold mr-1.5',
                (item.is_tombstoned || isDeactivated) && 'text-surface-400'
              )}
            >
              {item.is_tombstoned ? '사용자' : (item.user_profile?.nickname || '익명')}
            </span>
            <span className={cn(item.is_tombstoned && 'text-surface-400 italic')}>{item.content}</span>
          </div>

          {!item.is_tombstoned && (
            <div className="flex items-center gap-4 mt-1.5 text-[11px] font-medium text-surface-500">
              <span>{formatShortTime(item.created_at)}</span>
              {likeState.like_count > 0 && <span>좋아요 {likeState.like_count}개</span>}
              {!isDeactivated && canReply && (
                <button
                  type="button"
                  onClick={() => handleReplyClick(item.id, item.user_profile?.nickname || '익명', depth + 1)}
                  className="active:opacity-60"
                >
                  답글 달기
                </button>
              )}
              {isMyComment && (
                <button
                  type="button"
                  onClick={() => setDeleteConfirm({ id: item.id, isReply: isReply, parentId })}
                  className="text-rose-500/80"
                >
                  삭제
                </button>
              )}
            </div>
          )}

          {item.replies && item.replies.length > 0 && (
            <div className="mt-2.5">
              {!expandedReplies[item.id] ? (
                <button
                  type="button"
                  onClick={() => setExpandedReplies(prev => ({ ...prev, [item.id]: true }))}
                  className="flex items-center gap-3 text-[11px] font-semibold text-surface-500 active:opacity-60"
                >
                  <div className="w-6 h-[1px] bg-surface-300 dark:bg-surface-700" />
                  답글 {item.replies.length}개 보기
                </button>
              ) : (
                <div className="flex flex-col">
                  {item.replies.map((reply: PlaceComment) => renderComment(reply, depth + 1, item.id))}
                  <button
                    type="button"
                    onClick={() => setExpandedReplies(prev => ({ ...prev, [item.id]: false }))}
                    className="flex items-center gap-3 mt-3 text-[11px] font-semibold text-surface-500 active:opacity-60"
                  >
                    <div className="w-6 h-[1px] bg-surface-300 dark:bg-surface-700" />
                    답글 숨기기
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {!item.is_tombstoned && (
          <div className="flex-shrink-0 ml-auto">
            <button
              type="button"
              onClick={() => handleToggleLike(item, depth, parentId)}
              className="flex items-start pt-1 pl-3 pr-1 active:opacity-60 transition-opacity"
            >
              <Heart
                className={cn(
                  'size-[14px]',
                  likeState.is_liked ? 'fill-rose-500 text-rose-500' : 'text-surface-400'
                )}
              />
            </button>
          </div>
        )}
      </div>
    );
  };

  const remainingChars = MAX_LENGTH - comment.length;
  const isSubmitting = createComment.isPending;

  return (
    <>
      <Drawer open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DrawerContent className="h-[85vh] flex flex-col bg-white dark:bg-surface-950 border-surface-200 dark:border-surface-800 outline-none rounded-t-[28px] shadow-2xl max-w-lg mx-auto">
          <DrawerHeader className="relative flex flex-col items-center justify-center pb-3 border-b border-surface-100 dark:border-surface-800 shrink-0">
            <DrawerTitle className="text-[15px] font-bold text-surface-900 dark:text-white mt-1">
              댓글
            </DrawerTitle>
          </DrawerHeader>

          <div
            className="flex-1 overflow-y-auto min-h-0 overscroll-contain"
            style={{
              willChange: 'scroll-position',
              WebkitOverflowScrolling: 'touch',
              transform: 'translateZ(0)',
            }}
          >
            {isLoading ? (
              <div className="flex items-center justify-center py-20">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500" />
              </div>
            ) : comments && comments.length > 0 ? (
              <div className="flex flex-col px-4 pb-6">
                {(comments as PlaceComment[]).map((c) => renderComment(c))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-surface-400">
                <MessageCircle className="size-12 mb-3 opacity-20" />
                <p className="text-[14px] font-medium text-surface-600 dark:text-surface-400">
                  아직 댓글이 없습니다.
                </p>
                <p className="text-[12px] mt-1">첫 번째 댓글을 남겨보세요.</p>
              </div>
            )}
          </div>

          {/* 하단 고정 컴포저 영역 - 좌측에 현재 사용자 프로필 아이콘 */}
          <div className="border-t border-surface-100 dark:border-surface-800 bg-white dark:bg-surface-950 pb-safe shrink-0">
            {replyingTo && (
              <div className="flex items-center justify-between px-4 py-2.5 bg-surface-50 dark:bg-surface-900 border-b border-surface-100 dark:border-surface-800 transition-all">
                <span className="text-[12px] font-medium text-surface-600 dark:text-surface-400">
                  {replyingTo.nickname}님에게 답글 남기는 중
                </span>
                <button type="button" onClick={() => setReplyingTo(null)} className="p-1 -mr-1">
                  <X className="size-4 text-surface-400" />
                </button>
              </div>
            )}
            <div className="px-4 py-3">
              <form onSubmit={handleSubmit} className="flex flex-col gap-2">
                <div className="flex items-center gap-3">
                  {/* 좌측: 현재 나의 프로필 아이콘 */}
                  <div className="size-8 rounded-full bg-surface-200 dark:bg-surface-800 overflow-hidden flex-shrink-0">
                    {profile?.profile_image_url ? (
                      <img
                        src={profile.profile_image_url}
                        alt="내 프로필"
                        className="w-full h-full object-cover"
                        loading="lazy"
                        decoding="async"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[10px] font-medium text-surface-500">
                        {profile?.nickname?.slice(0, 1) || '?'}
                      </div>
                    )}
                  </div>
                  <div
                    className={cn(
                      'flex-1 relative flex items-center bg-surface-100 dark:bg-surface-900 rounded-full px-4 border transition-all',
                      'focus-within:ring-1 focus-within:ring-primary-500/30 focus-within:border-primary-500/50',
                      comment.length > MAX_LENGTH ? 'border-rose-500' : 'border-transparent'
                    )}
                  >
                    <input
                      ref={inputRef}
                      type="text"
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder={
                        replyingTo
                          ? `@${replyingTo.nickname} (최대 ${MAX_LENGTH}자)`
                          : `${profile?.nickname || '사용자'}님으로 댓글 달기... (최대 ${MAX_LENGTH}자)`
                      }
                      className="w-full bg-transparent py-2.5 text-[14px] focus:outline-none focus:ring-0 placeholder:text-surface-400"
                      style={{ fontSize: '16px' }}
                      maxLength={MAX_LENGTH}
                    />
                    <button
                      type="submit"
                      disabled={
                        !comment.trim() ||
                        comment.length > MAX_LENGTH ||
                        isSubmitting
                      }
                      className="flex-shrink-0 ml-2 text-primary-500 font-bold text-[14px] disabled:opacity-40 transition-opacity"
                    >
                      게시
                    </button>
                  </div>
                </div>

                {(remainingChars <= 20 || comment.length > MAX_LENGTH) && (
                  <div
                    className={cn(
                      'text-[10px] px-12 font-medium transition-colors',
                      remainingChars < 0 ? 'text-rose-500' : 'text-surface-400'
                    )}
                  >
                    {remainingChars < 0
                      ? `제한 글자수 ${Math.abs(remainingChars)}자 초과`
                      : `남은 글자수: ${remainingChars}자`}
                  </div>
                )}
              </form>
            </div>
          </div>
        </DrawerContent>
      </Drawer>

      <Dialog open={!!deleteConfirm} onOpenChange={(open) => !open && setDeleteConfirm(null)}>
        <DialogContent className="rounded-2xl max-w-[320px] p-6">
          <DialogTitle className="text-center font-bold text-lg">댓글 삭제</DialogTitle>
          <DialogDescription className="text-center text-sm text-surface-500 mt-2">
            삭제하면 댓글이 '삭제됨'으로 표시되고, 답글은 그대로 유지됩니다.
          </DialogDescription>
          <div className="flex gap-2 mt-6">
            <Button variant="ghost" className="flex-1" onClick={() => setDeleteConfirm(null)}>
              취소
            </Button>
            <Button
              className="flex-1 bg-rose-600 hover:bg-rose-700 text-white border-none"
              onClick={executeDelete}
              disabled={deleteComment.isPending}
            >
              삭제
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
