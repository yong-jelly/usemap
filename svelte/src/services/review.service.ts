import { execute_for_list } from '$lib/supabase';

/**
 * Place 음식점 리뷰 목록 조회
 * @param procedureName
 * @param size
 * @param from
 * @returns
 */
const execute = (procedureName: string, size: number, from: number) =>
	execute_for_list(procedureName, { p_limit: size, p_offset: from });

export const reviewService = {
	getReviewList2: async (params: { page: number; size: number; type: string }) => {
		const { page, size, type } = params;
		const from = (page - 1) * size;

		const queries = {
			latest: () => execute('v1_get_latest_reviews', size, from),
			hidden_gem: () => execute('v1_get_hidden_gem_reviews', size, from),
			visit_count: () => execute('v1_get_regular_customer_reviews', size, from),
			seasonal: () => execute('v1_get_seasonal_reviews', size, from),
			popularity: () => execute('v1_get_popularity_reviews', size, from),
			my_liked: () => execute('v1_get_my_liked_reviews', size, from),
		} as const;

		const selectedQuery = queries[type as keyof typeof queries];
		return selectedQuery?.() ?? execute('v1_get_popularity_reviews', size, from);
	},
};
