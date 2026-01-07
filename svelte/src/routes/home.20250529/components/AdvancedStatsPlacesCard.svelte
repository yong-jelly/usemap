<!-- @migration-task Error while migrating Svelte code: `$:` is not allowed in runes mode, use `$derived` or `$effect` instead
https://svelte.dev/e/legacy_reactive_statement_invalid -->
<script lang="ts">
	import { formatWithCommas } from '$utils/number.util';
	import { goto } from '@mateothegreat/svelte5-router';
    import { authStore } from '$services/auth.store';
	import { supabase } from '$lib/supabase';
	import { 
		Bookmark, 
		Heart, 
		TrendingUp, 
		Users, 
		Eye, 
		Clock, 
		Star,
		BarChart3,
		MapPin,
		Camera,
		MessageCircle
	} from 'lucide-svelte';
	import type { AdvancedStatsPlace } from '$lib/repositories/advanced-stats-types';

	// Props 인터페이스 정의
	interface Props {
		place: AdvancedStatsPlace;
		isExpanded?: boolean;
		onToggleExpand: () => void;
		onPlaceClick: () => void;
		formatDate: (date: string) => string;
		/** 추천 이유 (시간대별 알고리즘에서 전달) */
		recommendationReason?: string;
		/** 카드 표시 모드 */
		displayMode?: 'default' | 'trending' | 'loyalty' | 'engagement';
	}

	let { 
		place, 
		isExpanded = false, 
		onToggleExpand, 
		onPlaceClick, 
		formatDate,
		recommendationReason = '',
		displayMode = 'default'
	}: Props = $props();

	// 컴포넌트 내부 상태
	let isLiked = $state(false); // place에서 좋아요 정보가 없으므로 기본값
	let isSaved = $state(false); // place에서 저장 정보가 없으므로 기본값
	let isLiking = $state(false);
	let isSaving = $state(false);
	
	// 분석 통계 표시 여부
	let showAnalytics = $state(false);

	$inspect(place);

	/**
	 * 참여도 점수를 기반으로 카드 테마 색상 결정
	 * @param score 참여도 점수
	 * @returns 테마 클래스명
	 */
	const getEngagementTheme = (score?: number): string => {
		if (!score) return 'border-gray-200 bg-white';
		
		if (score >= 100) return 'border-purple-200 bg-gradient-to-br from-purple-50 to-indigo-50';
		if (score >= 75) return 'border-blue-200 bg-gradient-to-br from-blue-50 to-cyan-50';
		if (score >= 50) return 'border-green-200 bg-gradient-to-br from-green-50 to-emerald-50';
		if (score >= 25) return 'border-yellow-200 bg-gradient-to-br from-yellow-50 to-orange-50';
		return 'border-gray-200 bg-white';
	}

	/**
	 * 참여도 점수를 기반으로 등급 텍스트 반환
	 */
	const getEngagementGrade = (score?: number): { text: string; color: string } => {
		if (!score) return { text: '평가중', color: 'text-gray-500' };
		
		if (score >= 100) return { text: '최고 인기', color: 'text-purple-600' };
		if (score >= 75) return { text: '매우 인기', color: 'text-blue-600' };
		if (score >= 50) return { text: '인기', color: 'text-green-600' };
		if (score >= 25) return { text: '보통', color: 'text-yellow-600' };
		return { text: '신규', color: 'text-gray-500' };
	}

	/**
	 * 점수를 0-100 범위로 정규화
	 */
	const normalizeScore = (value?: number, max: number = 100): number => {
		if (!value) return 0;
		return Math.min((value / max) * 100, 100);
	}

	/**
	 * 성장률을 기반으로 트렌딩 상태 판별
	 */
	const getTrendingStatus = (growthRate?: number | null): { show: boolean; text: string; color: string } => {
		if (!growthRate || growthRate <= 1.2) return { show: false, text: '', color: '' };
		
		if (growthRate >= 3.0) return { show: true, text: '급상승', color: 'bg-red-500 text-white' };
		if (growthRate >= 2.0) return { show: true, text: '상승중', color: 'bg-orange-500 text-white' };
		if (growthRate >= 1.5) return { show: true, text: '인기증가', color: 'bg-green-500 text-white' };
		return { show: true, text: '성장중', color: 'bg-blue-500 text-white' };
	}

	/**
	 * 재방문율을 기반으로 충성도 배지 생성
	 */
	const getLoyaltyBadge = (revisitRate?: number): { show: boolean; text: string; color: string } => {
		if (!revisitRate || revisitRate <= 1.2) return { show: false, text: '', color: '' };
		
		if (revisitRate >= 3.0) return { show: true, text: '단골맛집', color: 'bg-purple-500 text-white' };
		if (revisitRate >= 2.0) return { show: true, text: '재방문多', color: 'bg-indigo-500 text-white' };
		return { show: true, text: '재방문', color: 'bg-blue-500 text-white' };
	}

	/**
	 * 최신성 점수를 기반으로 핫 배지 생성
	 */
	const getRecencyBadge = (recencyScore?: number): { show: boolean; text: string; color: string } => {
		if (!recencyScore || recencyScore <= 0.7) return { show: false, text: '', color: '' };
		
		if (recencyScore >= 0.9) return { show: true, text: 'HOT', color: 'bg-red-500 text-white animate-pulse' };
		if (recencyScore >= 0.8) return { show: true, text: '인기', color: 'bg-orange-500 text-white' };
		return { show: true, text: '주목', color: 'bg-yellow-500 text-white' };
	}

	// 기존 함수들 유지
	const checkAuthAndRedirect = async (actionName: string): Promise<boolean> => {
		if (!$authStore.isAuthenticated) {
			console.log(`${actionName} 로그인이 필요한 서비스 입니다.`);
			const ok = confirm(`로그인이 필요한 서비스 입니다. 로그인 페이지로 이동하시겠습니까?`);
			if (ok) {
				await goto('/auth/login');
			}
			return false;
		}
		return true;
	}

	const handleLikeClick = async () => {
		if (isLiking) return;
		if (!await checkAuthAndRedirect('좋아요')) return;

		isLiking = true;
		try {
			// 실제 좋아요 로직 구현 필요 (place 기반)
			// const { data, error } = await supabase.rpc('v1_toggle_like_place', {
			//     p_place_id: place.id
			// });
			
			// 임시로 상태만 토글
			isLiked = !isLiked;
		} catch (error: any) {
			console.error('좋아요 처리 중 오류 발생:', error);
			alert(error.message || '좋아요 처리에 실패했습니다.');
		} finally {
			isLiking = false;
		}
	}

	const handleSaveClick = async () => {
		if (isSaving) return;
		if (!await checkAuthAndRedirect('저장하기')) return;

		isSaving = true;
		try {
			// 실제 저장 로직 구현 필요 (place 기반)
			// const { data, error } = await supabase.rpc('v1_toggle_save_place', {
			//     p_place_id: place.id
			// });
			
			// 임시로 상태만 토글
			isSaved = !isSaved;
		} catch (error: any) {
			console.error('저장 처리 중 오류 발생:', error);
			alert(error.message || '저장 처리에 실패했습니다.');
		} finally {
			isSaving = false;
		}
	}

	// 분석 통계 데이터 computed
	const analyticsStats = $derived(() => place.review_analytics_stat);
	const engagementGrade = $derived(() => getEngagementGrade(analyticsStats()?.engagement_score));
	const trendingStatus = $derived(() => getTrendingStatus(analyticsStats()?.growth_rate));
	const loyaltyBadge = $derived(() => getLoyaltyBadge(analyticsStats()?.revisit_rate));
	const recencyBadge = $derived(() => getRecencyBadge(analyticsStats()?.recency_score));
</script>

<article class="mb-4 overflow-hidden rounded-xl shadow-lg transition-all duration-300 hover:shadow-xl {getEngagementTheme(analyticsStats()?.engagement_score)}">
	<!-- 상단 헤더: 장소 기본 정보 + 분석 배지들 -->
	<header class="relative p-4">
		<!-- 추천 이유 배지 (상단 우측) -->
		{#if recommendationReason}
			<div class="absolute top-3 right-3">
				<span class="bg-blue-100 text-blue-700 px-2 py-1 rounded-md text-xs font-medium">
					{recommendationReason}
				</span>
			</div>
		{/if}

		<!-- 장소 기본 정보 -->
		<div class="cursor-pointer" onclick={onPlaceClick}>
			<h2 class="text-xl font-bold text-gray-900 mb-2 pr-20">
				{place.name || '장소명 없음'}
			</h2>
			
			{#if place.address}
				<div class="flex items-center gap-1 text-sm text-gray-600 mb-3">
					<MapPin class="h-4 w-4" />
					<span>{place.address}</span>
				</div>
			{/if}

			<!-- 지역 태그들 -->
			<div class="flex flex-wrap gap-2 mb-3">
				{#if place.group1}
					<span class="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-md text-xs font-medium">
						{place.group1}
					</span>
				{/if}
				
				{#if place.group2}
					<span class="bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-md text-xs font-medium">
						{place.group2}
					</span>
				{/if}
				{#if place.group3}
					<span class="bg-purple-100 text-purple-700 px-2 py-0.5 rounded-md text-xs font-medium">
						{place.group3}
					</span>
				{/if}
				
			</div>
		</div>

		<!-- 분석 상태 배지들 -->
		<div class="flex flex-wrap gap-2 mt-3">
			<!-- 참여도 등급 -->
			{#if analyticsStats()?.engagement_score}
				<span class="flex items-center gap-1 {engagementGrade().color} bg-white/80 backdrop-blur-sm px-2 py-1 rounded-md text-xs font-semibold border">
					<Star class="h-3 w-3" />
					{engagementGrade().text}
				</span>
			{/if}

			<!-- 트렌딩 배지 -->
			{#if trendingStatus().show}
				<span class="flex items-center gap-1 {trendingStatus().color} px-2 py-1 rounded-md text-xs font-semibold">
					<TrendingUp class="h-3 w-3" />
					{trendingStatus().text}
				</span>
			{/if}

			<!-- 충성도 배지 -->
			{#if loyaltyBadge().show}
				<span class="flex items-center gap-1 {loyaltyBadge().color} px-2 py-1 rounded-md text-xs font-semibold">
					<Users class="h-3 w-3" />
					{loyaltyBadge().text}
				</span>
			{/if}

			<!-- 최신성 배지 -->
			{#if recencyBadge().show}
				<span class="flex items-center gap-1 {recencyBadge().color} px-2 py-1 rounded-md text-xs font-semibold">
					<Clock class="h-3 w-3" />
					{recencyBadge().text}
				</span>
			{/if}
		</div>
	</header>

	<!-- 분석 통계 표시 영역 (토글 가능) -->
	{#if analyticsStats()}
		<div class="px-4 pb-3">
			<button 
				class="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
				onclick={() => showAnalytics = !showAnalytics}
			>
				<BarChart3 class="h-4 w-4" />
				<span>분석 통계 {showAnalytics ? '숨기기' : '보기'}</span>
			</button>

			{#if showAnalytics}
				<div class="mt-3 space-y-3 bg-white/50 backdrop-blur-sm rounded-lg p-3 border">
					<!-- 주요 지표 그리드 -->
					<div class="grid grid-cols-2 gap-3">
						<!-- 참여도 점수 -->
						{#if analyticsStats()?.engagement_score}
							<div class="flex flex-col">
								<span class="text-xs text-gray-500 mb-1">종합 참여도</span>
								<div class="flex items-center gap-2">
									<div class="flex-1 bg-gray-200 rounded-full h-2">
										<div 
											class="bg-purple-500 h-2 rounded-full transition-all duration-500"
											style="width: {normalizeScore(analyticsStats()?.engagement_score ?? 0, 200)}%"
										></div>
									</div>
									<span class="text-xs font-semibold text-gray-700">
										{(analyticsStats()?.engagement_score ?? 0).toFixed(1)}
									</span>
								</div>
							</div>
						{/if}

						<!-- 재방문율 -->
						{#if analyticsStats()?.revisit_rate}
							<div class="flex flex-col">
								<span class="text-xs text-gray-500 mb-1">재방문율</span>
								<div class="flex items-center gap-2">
									<div class="flex-1 bg-gray-200 rounded-full h-2">
										<div 
											class="bg-green-500 h-2 rounded-full transition-all duration-500"
											style="width: {normalizeScore(analyticsStats()?.revisit_rate ?? 0, 5)}%"
										></div>
									</div>
									<span class="text-xs font-semibold text-gray-700">
										{(analyticsStats()?.revisit_rate ?? 0).toFixed(1)}x
									</span>
								</div>
							</div>
						{/if}

						<!-- 최신성 점수 -->
						{#if analyticsStats()?.recency_score}
							<div class="flex flex-col">
								<span class="text-xs text-gray-500 mb-1">최신성</span>
								<div class="flex items-center gap-2">
									<div class="flex-1 bg-gray-200 rounded-full h-2">
										<div 
											class="bg-orange-500 h-2 rounded-full transition-all duration-500"
											style="width: {normalizeScore((analyticsStats()?.recency_score ?? 0) * 100)}%"
										></div>
									</div>
									<span class="text-xs font-semibold text-gray-700">
										{((analyticsStats()?.recency_score ?? 0) * 100).toFixed(0)}%
									</span>
								</div>
							</div>
						{/if}

						<!-- 미디어 비율 -->
						{#if analyticsStats()?.media_ratio}
							<div class="flex flex-col">
								<span class="text-xs text-gray-500 mb-1">사진 풍부도</span>
								<div class="flex items-center gap-2">
									<Camera class="h-3 w-3 text-gray-400" />
									<span class="text-xs font-semibold text-gray-700">
										{(analyticsStats()?.media_ratio ?? 0).toFixed(1)}개/리뷰
									</span>
								</div>
							</div>
						{/if}
					</div>

					<!-- 추가 세부 지표 (접기/펼치기) -->
					{#if isExpanded}
						<div class="pt-3 border-t border-gray-200 space-y-2">
							{#if analyticsStats()?.avg_views}
								<div class="flex items-center justify-between">
									<span class="flex items-center gap-1 text-xs text-gray-500">
										<Eye class="h-3 w-3" />
										평균 조회수
									</span>
									<span class="text-xs font-semibold">
										{formatWithCommas(Math.round(analyticsStats()?.avg_views ?? 0))}
									</span>
								</div>
							{/if}

							{#if analyticsStats()?.avg_len}
								<div class="flex items-center justify-between">
									<span class="flex items-center gap-1 text-xs text-gray-500">
										<MessageCircle class="h-3 w-3" />
										평균 리뷰 길이
									</span>
									<span class="text-xs font-semibold">
										{Math.round(analyticsStats()?.avg_len ?? 0)}자
									</span>
								</div>
							{/if}

							{#if analyticsStats()?.growth_rate}
								<div class="flex items-center justify-between">
									<span class="flex items-center gap-1 text-xs text-gray-500">
										<TrendingUp class="h-3 w-3" />
										성장률
									</span>
									<span class="text-xs font-semibold {(analyticsStats()?.growth_rate ?? 0) > 1 ? 'text-green-600' : 'text-red-600'}">
										{(((analyticsStats()?.growth_rate ?? 0) - 1) * 100).toFixed(0)}%
									</span>
								</div>
							{/if}
						</div>
					{/if}

					<button 
						class="w-full text-xs text-blue-600 hover:text-blue-800 transition-colors"
						onclick={onToggleExpand}
					>
						{isExpanded ? '간단히 보기' : '자세히 보기'}
					</button>
				</div>
			{/if}
		</div>
	{/if}

	<!-- 액션 버튼 영역 -->
	<div class="flex items-center justify-between border-t border-white/50 px-4 py-3 backdrop-blur-sm bg-white/30">
		<div class="flex items-center gap-4">
			<!-- 좋아요 버튼 -->
			<button
				class="flex items-center gap-2 rounded-full px-3 py-2 transition-all hover:bg-white/80 disabled:opacity-50"
				onclick={handleLikeClick}
				disabled={isLiking}
			>
				<Heart 
					class="h-5 w-5 {isLiked ? 'fill-red-500 text-red-500' : 'text-gray-600'}" 
					fill={isLiked ? 'currentColor' : 'none'} 
				/>
				<span class="text-sm font-medium {isLiked ? 'text-red-600' : 'text-gray-700'}">
					좋아요
				</span>
			</button>

			<!-- 저장 버튼 -->
			<button
				class="flex items-center gap-2 rounded-full px-3 py-2 transition-all hover:bg-white/80 disabled:opacity-50"
				onclick={handleSaveClick}
				disabled={isSaving}
			>
				<Bookmark 
					class="h-5 w-5 {isSaved ? 'fill-blue-500 text-blue-500' : 'text-gray-600'}" 
					fill={isSaved ? 'currentColor' : 'none'} 
				/>
				<span class="text-sm font-medium {isSaved ? 'text-blue-600' : 'text-gray-700'}">
					저장
				</span>
			</button>
		</div>

		<!-- 네이버 지도 버튼 -->
		<a
			href={`https://map.naver.com/p/entry/place/${place.id}`}
			target="_blank"
			rel="noopener noreferrer"
			class="flex items-center gap-2 rounded-full px-3 py-2 text-gray-600 transition-all hover:bg-white/80"
		>
			<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
				></path>
			</svg>
			<span class="text-sm font-medium">지도보기</span>
		</a>
	</div>
</article>
