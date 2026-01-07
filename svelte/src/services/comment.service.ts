// import { supabase } from '$lib/supabase';
// import type { SupabaseComment, CreateCommentData, UpdateCommentData } from './types';

// export const commentService = {
// 	/**
// 	 * 특정 장소의 댓글 목록을 조회합니다.
// 	 */
// 	async getCommentsForPlace(
// 		businessId: string,
// 		limit = 20,
// 		offset = 0,
// 	): Promise<{ data: SupabaseComment[] | null; error: any }> {
// 		try {
// 			const { data, error } = await supabase.rpc('v1_get_comments_for_place', {
// 				p_business_id: businessId,
// 				p_limit: limit,
// 				p_offset: offset,
// 			});
			
// 			if (error) {
// 				console.error('댓글 목록 조회 오류:', error);
// 				throw error;
// 			}
			
// 			return { data: data as SupabaseComment[] | null, error: null };
// 		} catch (error) {
// 			console.error('댓글 목록 조회 중 오류 발생:', error);
// 			return { data: null, error };
// 		}
// 	},

// 	/**
// 	 * 새로운 장소 댓글을 생성하고 생성된 댓글 데이터를 반환합니다.
// 	 */
// 	async createCommentForPlace(
// 		commentData: CreateCommentData,
// 	): Promise<{ data: SupabaseComment | null; error: any }> {
// 		try {
// 			const { business_id, content, title, image_paths, parent_comment_id } = commentData;
// 			const comment_level = parent_comment_id ? 1 : 0;

// 			const { data, error } = await supabase.rpc('v1_create_comment_for_place', {
// 				p_business_id: business_id,
// 				p_content: content,
// 				p_title: title,
// 				p_image_paths: image_paths,
// 				p_parent_comment_id: parent_comment_id,
// 				p_comment_level: comment_level,
// 			}).single();

// 			if (error) {
// 				console.error('댓글 생성 오류:', error);
// 				throw error;
// 			}

// 			return { data: data as SupabaseComment | null, error: null };
// 		} catch (error) {
// 			console.error('댓글 생성 중 오류 발생:', error);
// 			return { data: null, error };
// 		}
// 	},

// 	/**
// 	 * 장소 댓글 내용을 수정합니다.
// 	 */
// 	async updateCommentForPlace(
// 		commentId: string,
// 		commentData: UpdateCommentData,
// 	): Promise<{ data: boolean | null; error: any }> {
// 		try {
// 			const { content, title, image_paths } = commentData;
// 			const { data, error } = await supabase.rpc('v1_update_comment_for_place', {
// 				p_comment_id: commentId, 
// 				p_content: content, 
// 				p_title: title, 
// 				p_image_paths: image_paths,
// 			});

// 			if (error) {
// 				console.error('댓글 수정 오류:', error);
// 				throw error;
// 			}

// 			return { data, error: null };
// 		} catch (error) {
// 			console.error('댓글 수정 중 오류 발생:', error);
// 			return { data: null, error };
// 		}
// 	},

// 	/**
// 	 * 장소 댓글을 비활성화 (소프트 삭제) 합니다.
// 	 */
// 	async deactivateCommentForPlace(commentId: string): Promise<{ data: boolean | null; error: any }> {
// 		try {
// 			const { data, error } = await supabase.rpc('v1_deactivate_comment_for_place', { 
// 				p_comment_id: commentId 
// 			});

// 			if (error) {
// 				console.error('댓글 비활성화 오류:', error);
// 				throw error;
// 			}

// 			return { data, error: null };
// 		} catch (error) {
// 			console.error('댓글 비활성화 중 오류 발생:', error);
// 			return { data: null, error };
// 		}
// 	},

// 	/**
// 	 * 장소 댓글 좋아요 상태를 토글합니다.
// 	 */
// 	async toggleCommentLikeForPlace(commentId: string): Promise<{ data: boolean | null; error: any }> {
// 		try {
// 			const { data, error } = await supabase.rpc('v1_toggle_comment_like_for_place', { 
// 				p_comment_id: commentId 
// 			});

// 			if (error) {
// 				console.error('댓글 좋아요 토글 오류:', error);
// 				throw error;
// 			}

// 			return { data, error: null };
// 		} catch (error) {
// 			console.error('댓글 좋아요 토글 중 오류 발생:', error);
// 			return { data: null, error };
// 		}
// 	},

// 	/**
// 	 * 특정 장소의 활성 댓글 총 개수를 조회합니다.
// 	 */
// 	async getCommentCountForPlace(businessId: string): Promise<{ data: number | null; error: any }> {
// 		try {
// 			const { data, error } = await supabase.rpc('v1_get_comment_count_for_place', { 
// 				p_business_id: businessId 
// 			});

// 			if (error) {
// 				console.error('댓글 개수 조회 오류:', error);
// 				throw error;
// 			}

// 			return { data, error: null };
// 		} catch (error) {
// 			console.error('댓글 개수 조회 중 오류 발생:', error);
// 			return { data: null, error };
// 		}
// 	}
// };
