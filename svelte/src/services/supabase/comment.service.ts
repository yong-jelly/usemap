// src/services/supabase/comment.service.ts
import { supabase } from '$lib/supabase';
// 타입들을 types.ts 에서 가져오기
import type { AuthUser, SupabaseComment, CreateCommentData, UpdateCommentData } from '../types';

/**
 * 특정 장소의 댓글 목록을 조회합니다.
 */
async function getCommentsForPlace(
	businessId: string,
	limit = 20,
	offset = 0,
): Promise<{ data: SupabaseComment[] | null; error: any }> {
	const { data, error } = await supabase.rpc('v1_get_comments_for_place', {
		p_business_id: businessId,
		p_limit: limit,
		p_offset: offset,
	});
    if (error) console.error('Error fetching comments:', error);
	// likes, isLiked 기본값 보정
	const mapped = (data as SupabaseComment[] | null)?.map(c => ({
		...c,
		likes: c.likes ?? 0,
		isLiked: c.isLiked ?? false,
	})) ?? null;
	return { data: mapped, error };
}

/**
 * 새로운 장소 댓글을 생성하고 생성된 댓글 데이터를 반환합니다.
 * @param commentData 생성할 댓글 정보
 * @returns 생성된 댓글 정보 또는 null Promise
 */
async function createCommentForPlace( // user 파라미터 제거
	commentData: CreateCommentData,
): Promise<{ data: SupabaseComment | null; error: any }> { // 반환 타입을 SupabaseComment 로 변경
    // user 파라미터 제거됨 (함수 내부에서 auth.uid() 사용)

    const { business_id, content, title, image_paths, parent_comment_id } = commentData;
    const comment_level = parent_comment_id ? 1 : 0;

	// RPC 호출 시 파라미터에서 p_user_id 제거
    // 반환값이 단일 행이므로 .single() 사용
	const { data, error } = await supabase.rpc('v1_create_comment_for_place', {
        p_business_id: business_id,
        p_content: content,
        p_title: title,
        p_image_paths: image_paths,
        p_parent_comment_id: parent_comment_id,
        p_comment_level: comment_level,
	}).single(); // 단일 결과 반환 기대

    if (error) {
        console.error('Error creating comment:', error);
    }

    // 반환된 data 타입은 SupabaseComment | null
	return { data: data as SupabaseComment | null, error };
}

/**
 * 장소 댓글 내용을 수정합니다.
 */
async function updateCommentForPlace(
	commentId: string,
	commentData: UpdateCommentData,
): Promise<{ data: boolean | null; error: any }> {
    const { content, title, image_paths } = commentData;
	const { data, error } = await supabase.rpc('v1_update_comment_for_place', {
        p_comment_id: commentId, p_content: content, p_title: title, p_image_paths: image_paths,
	});
    if (error) console.error('Error updating comment:', error);
	return { data, error };
}

/**
 * 장소 댓글을 비활성화 (소프트 삭제) 합니다.
 */
async function deactivateCommentForPlace( commentId: string ): Promise<{ data: boolean | null; error: any }> {
	const { data, error } = await supabase.rpc('v1_deactivate_comment_for_place', { p_comment_id: commentId });
     if (error) console.error('Error deactivating comment:', error);
	return { data, error };
}

/**
 * 장소 댓글 좋아요 상태를 토글합니다.
 */
async function toggleCommentLikeForPlace( commentId: string ): Promise<{ data: boolean | null; error: any }> {
	const { data, error } = await supabase.rpc('v1_toggle_comment_like_for_place', { p_comment_id: commentId });
    if (error) console.error('Error toggling comment like:', error);
	return { data, error };
}

/**
 * 특정 장소의 활성 댓글 총 개수를 조회합니다.
 */
async function getCommentCountForPlace( businessId: string ): Promise<{ data: number | null; error: any }> {
    const { data, error } = await supabase.rpc('v1_get_comment_count_for_place', { p_business_id: businessId });
    if (error) console.error('Error fetching comment count:', error);
    return { data, error };
}

export const supabaseCommentService = {
	getCommentsForPlace, getCommentCountForPlace, createCommentForPlace,
	updateCommentForPlace, deactivateCommentForPlace, toggleCommentLikeForPlace,
};
