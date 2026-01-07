import { supabase } from '$lib/supabase';

/**
 * 탭별 음식점 목록 조회
 * @param tabName 탭명: 'local', 'popular', 'discovery' 또는 null(전체)
 * @param group1 지역 필터 (선택사항)
 * @param offset 조회할 음식점 수의 오프셋
 * @param limit 조회할 음식점 수
 * @param orderBy 정렬 기준: 'rank_in_region', 'total_score', 'visitor_reviews_score'
 * @returns 탭별 음식점 목록
 */
async function getPlacesByTab(
	tabName: string | null = null,
	group1: string | null = null,
	offset: number = 0,
	limit: number = 10,
	orderBy: string = 'rank_in_region'
) {
	const { data, error } = await supabase.rpc('v1_list_places_by_tab', {
		p_tab_name: tabName,
		p_group1: group1,
		p_offset: offset,
		p_limit: limit,
		p_order_by: orderBy
	});
	
	if (error) {
		console.error('Error fetching places by tab:', error);
	}
	
	return data;
}


export const feedService = {
	getPlacesByTab
};
