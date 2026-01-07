// src/services/supabase/comment.service.ts
import { supabase } from '$lib/supabase';


/**
 * 내가 좋아요 누른 음식점 목록 조회
 * @param limit 조회할 음식점 수
 * @param offset 조회할 음식점 수의 오프셋
 * @returns 내가 좋아요 누른 음식점 목록
 */
async function getMyLikedPlaces(limit: number = 100, offset: number = 0) {
        const { data, error: rpcError } = await supabase.rpc('v1_get_my_liked_places', {
            p_limit: limit,
            p_offset: offset
        });
		return data;
}

/**
 * 내가 좋아요 누른 음식점 목록 조회
 * @param limit 조회할 음식점 수
 * @param offset 조회할 음식점 수의 오프셋
 * @returns 내가 좋아요 누른 음식점 목록
 */
async function getMyBookmarkedPlaces(limit: number = 100, offset: number = 0) {
	const { data, error: rpcError } = await supabase.rpc('v1_get_my_bookmarked_places', {
		p_limit: limit,
		p_offset: offset
	});
	return data;
}

/**
 * 내가 최근 본 음식점 목록 조회
 * @param limit 조회할 음식점 수
 * @param offset 조회할 음식점 수의 오프셋
 * @returns 내가 최근 본 음식점 목록
 */
async function getMyRecentViewPlaces(limit: number = 100, offset: number = 0) {
        const { data, error: rpcError } = await supabase.rpc('v1_get_my_recent_view_places', {
            p_limit: limit,
            p_offset: offset
        });
		return data;
}

async function getMyVisitedPlaces(limit: number = 100, offset: number = 0) {
	const { data, error: rpcError } = await supabase.rpc('v1_list_visited_place', {
		p_limit: limit,
		p_offset: offset
	});
	return data;
}


export const supabaseProfileService = {
	getMyLikedPlaces,
	getMyBookmarkedPlaces,
	getMyRecentViewPlaces,
	getMyVisitedPlaces
};
