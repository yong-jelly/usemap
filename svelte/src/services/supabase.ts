import { createClient } from '@supabase/supabase-js';
import type { Place, PlaceDetail } from './types';

// Supabase API 설정
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
	throw new Error('Missing Supabase environment variables');
}

// Supabase 클라이언트 생성
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// 투표 아이템 인터페이스
export interface VoteItem {
	code: string;
	text: string;
	count: number;
}

// 대형 프랜차이즈 필터링 패턴
const franchiseFilterPattern =
	'(배스킨라빈스|뚜레쥬르|교촌치킨|맥도날드|MGC|맘스터치|이디야|푸라닭|카페블루하우스|하은이네|더벤티|엔제리너스|DT점|빽다방|컴포즈|스타벅스|에이바우트|도시락|롯데리아|버거킹|BBQ|파리바게뜨|네네치킨)';

export const supabasePlaceService = {
	getPlaceDetail: async (id: string) => {
		const { data: data, error: latestError } = await supabase.rpc('v1_get_place_by_id_with_set_recent_view', {
			p_business_id: id,
		});

		if (latestError) throw latestError;

		return {
			epoch: Date.now(),
			meta: {
				timestamp: new Date().toISOString(),
				message: 'Success',
				code: 200,
			},
			result: { row: data as Place },
		};
	},
};

// 리뷰 서비스
export const supabaseReviewService = {
	/**
	 * Supabase에서 리뷰 목록을 가져옵니다.
	 * @param page 페이지 번호
	 * @param size 페이지 크기
	 * @param type 리뷰 타입 (인기, 발견, 시즌, 단골, 최신)
	 * @returns 리뷰 데이터
	 */
	getReviewList: async (params: { page: number; size: number; type: string }) => {
		const { page, size, type } = params;

		// 뷰 이름 매핑
		const viewMapping: Record<string, string> = {
			popularity: 'mv_place_review_popularity_for_3m_10k',
			hidden_gem: 'mv_place_review_hidden_gem_for_10k',
			seasonal: 'mv_place_review_seasonal_for_2y_10k',
			visit_count: 'mv_place_review_regular_customer_for_10k',
			latest: 'mv_place_review_popularity_for_3m_10k', // 최신은 일시적으로 인기 뷰를 사용
		};

		const viewName = viewMapping[type] || viewMapping['popularity'];
		const from = (page - 1) * size;
		const to = from + size - 1;

		try {
			let query = supabase
				.from(viewName)
				.select('*')
				.not('business_name', 'ilike', franchiseFilterPattern)
				.not('media', 'is', null);

			// 각 타입별 정렬 로직 적용
			switch (type) {
				case 'latest':
					// 최신순으로 정렬
					// 최신순: 복잡한 정렬 조건을 위해 RPC 사용
					const { data: latestData, error: latestError } = await supabase.rpc(
						'v1_get_latest_reviews',
						{
							p_limit: size,
							p_offset: from,
						},
					);

					if (latestError) throw latestError;

					return {
						epoch: Date.now(),
						meta: {
							timestamp: new Date().toISOString(),
							message: 'Success',
							code: 200,
						},
						result: {
							rows: latestData || [],
						},
					};

				case 'hidden_gem':
					// 숨은 보석: 리뷰 ID와 시간을 기반으로 한 랜덤 정렬
					// md5 함수는 PostgreSQL 함수라 Supabase에서는 직접 사용할 수 없음
					// 대신 RPC(원격 함수 호출)를 사용하거나 다른 방식으로 정렬
					const { data, error } = await supabase.rpc('v1_get_hidden_gem_reviews', {
						p_limit: size,
						p_offset: from,
					});

					if (error) throw error;

					// RPC 결과를 반환
					return {
						epoch: Date.now(),
						meta: {
							timestamp: new Date().toISOString(),
							message: 'Success',
							code: 200,
						},
						result: {
							rows: data || [],
						},
					};

				case 'visit_count':
					// 단골: 복잡한 정렬 조건을 위해 RPC 사용
					const { data: regularData, error: regularError } = await supabase.rpc(
						'v1_get_regular_customer_reviews',
						{
							p_limit: size,
							p_offset: from,
						},
					);

					if (regularError) throw regularError;

					return {
						epoch: Date.now(),
						meta: {
							timestamp: new Date().toISOString(),
							message: 'Success',
							code: 200,
						},
						result: {
							rows: regularData || [],
						},
					};

				case 'seasonal':
					// 시즌: 시간/요일/날짜에 따른 복잡한 정렬을 위해 RPC 사용
					const { data: seasonalData, error: seasonalError } = await supabase.rpc(
						'v1_get_seasonal_reviews',
						{
							p_limit: size,
							p_offset: from,
						},
					);

					if (seasonalError) throw seasonalError;

					return {
						epoch: Date.now(),
						meta: {
							timestamp: new Date().toISOString(),
							message: 'Success',
							code: 200,
						},
						result: {
							rows: seasonalData || [],
						},
					};

				case 'popularity':
				default:
					// 인기: 시간/요일/날짜에 따른 복잡한 정렬을 위해 RPC 사용
					const { data: popularityData, error: popularityError } = await supabase.rpc(
						'v1_get_popularity_reviews',
						{
							p_limit: size,
							p_offset: from,
						},
					);

					if (popularityError) throw popularityError;

					return {
						epoch: Date.now(),
						meta: {
							timestamp: new Date().toISOString(),
							message: 'Success',
							code: 200,
						},
						result: {
							rows: popularityData || [],
						},
					};
			}

			// 최신순의 경우 여기서 쿼리 실행
			if (type === 'latest') {
				const { data, error } = await query.range(from, to);

				if (error) {
					throw error;
				}

				return {
					epoch: Date.now(),
					meta: {
						timestamp: new Date().toISOString(),
						message: 'Success',
						code: 200,
					},
					result: {
						rows: data || [],
					},
				};
			}
		} catch (error) {
			console.error('Supabase 리뷰 데이터 조회 실패:', error);
			throw error;
		}
	},
};
