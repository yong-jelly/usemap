// src/routes/place/comment.logic.ts
// 타입을 types.ts 에서 통합하여 가져오도록 수정
import type { SupabaseComment, AuthUser } from '$services/types';

/**
 * 플랫 댓글 리스트를 받아 계층 구조로 변환하고 정렬합니다.
 * @param flatCommentList Supabase에서 받아온 플랫 댓글 리스트
 * @param existingComments 기존에 로드된 구조화된 댓글 리스트 (더보기 로드 시 사용)
 * @returns 구조화되고 정렬된 댓글 리스트
 */
export function structureComments(
	flatCommentList: SupabaseComment[],
	existingComments: SupabaseComment[] = [],
): SupabaseComment[] {
	const allCommentsMap = new Map<string, SupabaseComment>();

	existingComments.forEach((root) => {
		allCommentsMap.set(root.id, { ...root, replies: [] });
		(root.replies || []).forEach((reply: SupabaseComment) => allCommentsMap.set(reply.id, { ...reply }));
	});

	flatCommentList.forEach((c) => allCommentsMap.set(c.id, { ...c, replies: [] }));

	const rootComments: SupabaseComment[] = [];
	const repliesMap = new Map<string, SupabaseComment[]>();

	allCommentsMap.forEach((comment) => {
		if (comment.comment_level === 0) {
			comment.replies = [];
			comment.reply_count = 0;
			rootComments.push(comment);
		} else if (comment.parent_comment_id) {
			const parentReplies = repliesMap.get(comment.parent_comment_id) || [];
			parentReplies.push(comment);
			repliesMap.set(comment.parent_comment_id, parentReplies);
		}
	});

	rootComments.forEach((rc) => {
		const foundReplies = repliesMap.get(rc.id) || [];
		foundReplies.sort(
			(a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
		);
		rc.replies = foundReplies;
		rc.reply_count = foundReplies.length;
	});

	rootComments.sort(
		(a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
	);

	return rootComments;
}

/**
 * 새 댓글(원본) 생성 후 댓글 목록 상태 업데이트
 */
export function addCommentToList(
	currentComments: SupabaseComment[],
	newCommentData: SupabaseComment,
): SupabaseComment[] {
	return [newCommentData, ...currentComments];
}

/**
 * 새 답글 생성 후 댓글 목록 상태 업데이트
 */
export function addReplyToList(
	currentComments: SupabaseComment[],
	newReplyData: SupabaseComment,
): SupabaseComment[] | null {
	const parentCommentIndex = currentComments.findIndex(
		(c) => c.id === newReplyData.parent_comment_id,
	);

	if (parentCommentIndex > -1) {
		const updatedComments = [...currentComments];
		const parentComment = { ...updatedComments[parentCommentIndex] };
		parentComment.replies = [...(parentComment.replies || []), newReplyData];
		parentComment.reply_count = (parentComment.reply_count ?? 0) + 1;
		updatedComments[parentCommentIndex] = parentComment;
		return updatedComments;
	} else {
		console.warn('Parent comment not found in current list for new reply.');
		return null;
	}
}

/**
 * 댓글 삭제(비활성화) 후 댓글 목록 상태 업데이트
 */
export function removeCommentFromList(
	currentComments: SupabaseComment[],
	commentId: string,
): { result: SupabaseComment[]; decreaseCount: number } {
	let updatedComments = [...currentComments];
	let decreaseCount = 0;
	const commentToRemoveIndex = updatedComments.findIndex((c) => c.id === commentId);

	if (commentToRemoveIndex > -1) {
		const commentToRemove = updatedComments[commentToRemoveIndex];
		decreaseCount = 1 + (commentToRemove.replies?.length ?? 0);
		updatedComments.splice(commentToRemoveIndex, 1);
	} else {
		let parentIndex = -1;
		let replyIndex = -1;

		for (let i = 0; i < updatedComments.length; i++) {
			const root = updatedComments[i];
			if (root.replies) {
				replyIndex = root.replies.findIndex((r: SupabaseComment) => r.id === commentId);
				if (replyIndex > -1) {
					parentIndex = i;
					break;
				}
			}
		}

		if (parentIndex > -1 && replyIndex > -1) {
			const parentComment = { ...updatedComments[parentIndex] };
			parentComment.replies = [...(parentComment.replies || [])];
			parentComment.replies.splice(replyIndex, 1);
			parentComment.reply_count = (parentComment.reply_count ?? 1) - 1;
			updatedComments[parentIndex] = parentComment;
			decreaseCount = 1;
		} else {
			console.warn('Comment to remove not found:', commentId);
		}
	}

	return { result: updatedComments, decreaseCount };
}

/**
 * 댓글 좋아요 토글 후 목록 상태 업데이트
 */
export function toggleLikeInList(
	currentComments: SupabaseComment[],
	commentId: string,
	isLikedNow: boolean,
): SupabaseComment[] {
    const applyLike = (comment: SupabaseComment) => {
        if (comment.id === commentId) {
            return { ...comment, isLiked: isLikedNow };
        }
        return comment;
    };

	return currentComments.map(root => {
        if (root.id === commentId) {
            return applyLike(root);
        }
        if (root.replies) {
            const updatedReplies = root.replies.map(applyLike);
            if (updatedReplies !== root.replies) {
                 return { ...root, replies: updatedReplies };
            }
        }
        return root;
    });
}

/**
 * 댓글 수정 후 목록 상태 업데이트
 */
export function updateCommentInList(
	currentComments: SupabaseComment[],
	updatedCommentData: SupabaseComment,
): SupabaseComment[] {
    const applyUpdate = (comment: SupabaseComment) => {
         if (comment.id === updatedCommentData.id) {
            return {
                ...comment,
                content: updatedCommentData.content,
                title: updatedCommentData.title,
                image_paths: updatedCommentData.image_paths,
                updated_at: updatedCommentData.updated_at || new Date().toISOString(),
            };
         }
         return comment;
    }

    return currentComments.map(root => {
        if (root.id === updatedCommentData.id) {
            return applyUpdate(root);
        }
         if (root.replies) {
            const updatedReplies = root.replies.map(applyUpdate);
            if (updatedReplies !== root.replies) {
                 return { ...root, replies: updatedReplies };
            }
        }
        return root;
    });
}