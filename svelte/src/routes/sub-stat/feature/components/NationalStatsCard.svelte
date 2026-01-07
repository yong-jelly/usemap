<script lang="ts">
	import type { RecommendationStatsBucket } from '$services/types';
	import { goto } from '@mateothegreat/svelte5-router';
	import {
		MapPin,
		ChevronLeft,
		ChevronRight,
		ChevronDown,
		Youtube,
		MessageSquare,
		BarChart3,
		ArrowLeft,
	} from 'lucide-svelte';

	interface CategoryStats {
		name: string;
		count: number;
		percentage: number;
	}

	interface RegionStats {
		name: string;
		count: number;
		rank: number;
	}

	const { bucket } = $props<{ bucket: RecommendationStatsBucket | undefined }>();

	// 전체 + group_stats 개수만큼 뷰 생성
	let totalViews = $derived(bucket ? 1 + bucket.bucket_data_jsonb.group_stats.length : 1);
	let currentViewIndex = $state(0);
	let showAllCategories = $state(false);
	let showAllRegions = $state(false);

	function formatNumber(num: number): string {
		if (num >= 10000) {
			return `${(num / 10000).toFixed(1)}만`;
		}
		if (num >= 1000) {
			return `${(num / 1000).toFixed(1)}K`;
		}
		return num.toString();
	}

	function getDomainStats() {
		if (!bucket || currentViewIndex !== 0) return [];

		const allStats = bucket.bucket_data_jsonb.all_stats;
		const totalCount = allStats.total_row_count;

		return bucket.bucket_data_jsonb.group_stats
			.map((stat: any) => ({
				domain: stat.domain,
				platform_type: stat.platform_type,
				count: stat.total_row_count,
				percentage: (stat.total_row_count / totalCount) * 100,
			}))
			.sort((a: any, b: any) => b.count - a.count);
	}

	function getCurrentData() {
		if (!bucket) {
			return {
				totalRestaurants: 0,
				totalRecommendations: 0,
				totalUsers: 0,
				topCategories: [],
				topRegions: [],
			};
		}

		function processCategories(categoryAggregation: any[], totalPlaceCount: number) {
			// 카테고리를 count 기준으로 내림차순 정렬
			const sortedCategories = categoryAggregation
				.map((cat: any) => ({
					name: cat.category,
					count: cat.place_count,
					percentage: (cat.place_count / totalPlaceCount) * 100,
				}))
				.sort((a, b) => b.count - a.count);

			// Top 10 추출
			const top10 = sortedCategories.slice(0, 10);

			// 11번째 이후 항목들을 "기타"로 합치기
			const others = sortedCategories.slice(10);
			const othersTotal = others.reduce((sum, cat) => sum + cat.count, 0);

			let result = [...top10];

			// 기타 항목이 있으면 추가
			if (others.length > 0 && othersTotal > 0) {
				result.push({
					name: '기타',
					count: othersTotal,
					percentage: (othersTotal / totalPlaceCount) * 100,
				});
			}

			return result;
		}

		if (currentViewIndex === 0) {
			// 전체 데이터
			const allStats = bucket.bucket_data_jsonb.all_stats;
			return {
				totalRestaurants: allStats.total_place_count,
				totalRecommendations: allStats.total_row_count,
				totalUsers: allStats.total_user_count,
				topCategories: processCategories(allStats.category_aggregation, allStats.total_place_count),
				topRegions: allStats.region_aggregation.map((region: any, index: number) => ({
					name: region.group1,
					count: region.place_count,
					rank: index + 1,
				})),
			};
		} else {
			//
			console.log('group_stats 데이터?');
			const groupStat = bucket.bucket_data_jsonb.group_stats[currentViewIndex - 1];

			return {
				totalRestaurants: groupStat.total_place_count,
				totalRecommendations: groupStat.total_row_count,
				totalUsers: groupStat.total_user_count,
				topCategories: processCategories(
					groupStat.category_aggregation,
					groupStat.total_place_count,
				),
				topRegions: groupStat.region_aggregation.map((region: any, index: number) => ({
					name: region.group1,
					count: region.place_count,
					rank: index + 1,
				})),
			};
		}
	}

	function getViewTitle() {
		if (!bucket || currentViewIndex === 0) return '전체';
		const groupStat = bucket.bucket_data_jsonb.group_stats[currentViewIndex - 1];
		// return `${domainToName(groupStat.domain)} 통계`;
		return `${domainToName(groupStat.domain)}`;
	}

	function getViewIcon() {
		if (!bucket || currentViewIndex === 0) return MapPin;
		const groupStat = bucket.bucket_data_jsonb.group_stats[currentViewIndex - 1];
		if (groupStat.platform_type === 'youtube') return Youtube;
		if (groupStat.platform_type === 'community') return MessageSquare;
		return BarChart3;
	}

	function getViewLabel() {
		// if (!bucket || currentViewIndex === 0) return '전국 통계';
		if (!bucket || currentViewIndex === 0) return '전국';
		const groupStat = bucket.bucket_data_jsonb.group_stats[currentViewIndex - 1];
		return domainToName(groupStat.domain);
	}

	function nextView() {
		currentViewIndex = (currentViewIndex + 1) % totalViews;
	}

	function prevView() {
		currentViewIndex = currentViewIndex === 0 ? totalViews - 1 : currentViewIndex - 1;
	}

	function domainToName(domain: string) {
		if (domain === 'clien.net') return '클리앙';
		if (domain === 'damoang.net') return '다모앙';
		if (domain === 'youtube') return '유튜브';
		if (domain === 'bobaedream.co.kr') return '보배드림';
		return domain;
	}

	let currentData = $derived(getCurrentData());
	let viewTitle = $derived(getViewTitle());
	let ViewIcon = $derived(getViewIcon());
	let viewLabel = $derived(getViewLabel());
	let domainStats = $derived(getDomainStats());
	let displayedCategories = $derived(
		showAllCategories ? currentData.topCategories : currentData.topCategories.slice(0, 4),
	);
	let displayedRegions = $derived(
		showAllRegions ? currentData.topRegions : currentData.topRegions.slice(0, 4),
	);

	// 하드코딩된 내 기여도 데이터 (실제 데이터가 없으므로)
	const myContribution = {
		restaurants: 12,
		recommendations: 25,
		rank: 347,
	};

	// 도메인별 색상 배열
	const colors = [
		'bg-blue-500',
		'bg-green-500',
		'bg-yellow-500',
		'bg-purple-500',
		'bg-red-500',
		'bg-indigo-500',
		'bg-pink-500',
		'bg-orange-500',
	];

	function handleBack() {
		// 히스토리가 있는지 확인
		const hasHistory = window.history.length > 1;
		const hasReferrer =
			document.referrer &&
			document.referrer !== window.location.href &&
			new URL(document.referrer).origin === window.location.origin;

		// 히스토리가 있고 같은 도메인에서 온 경우 뒤로가기
		if (hasHistory && hasReferrer) {
			window.history.back();
		} else {
			// 히스토리가 없거나 외부에서 온 경우 /feature로 이동
			goto('/feature');
		}
	}
</script>

<!-- 고정 헤더 -->
<div class="fixed top-0 right-0 left-0 z-50 bg-white">
	<div class="mx-auto max-w-lg border-b border-gray-200 px-4 py-3">
		<div class="flex items-center gap-3">
			<button
				onclick={handleBack}
				class="flex h-9 w-9 items-center justify-center rounded-full bg-gray-50 transition-colors hover:bg-gray-100 active:bg-gray-200"
				aria-label="뒤로가기"
			>
				<ArrowLeft class="h-5 w-5 text-gray-700" />
			</button>
			<h1 class="text-lg font-semibold text-gray-900">커뮤니티 추천 링크 통계</h1>
		</div>
	</div>
</div>

<article class="min-h-screen bg-white pt-16">
	<!-- 컨텐츠 헤더 -->
	<div class="sticky top-16 z-40 border-b border-gray-100 bg-white">
		<div class="mx-auto max-w-lg px-4 py-3">
			<!-- 뷰 네비게이션 -->
			<div class="mb-2 flex items-center justify-between">
				<button
					onclick={prevView}
					class="flex h-10 w-10 items-center justify-center rounded-full bg-gray-50 transition-colors hover:bg-gray-100 active:bg-gray-200"
					aria-label="이전 보기"
				>
					<ChevronLeft class="h-6 w-6 text-gray-600" />
				</button>

				<div class="flex-1 text-center">
					<div class="mb-1 flex items-center justify-center gap-2">
						<!-- <ViewIcon class="h-4 w-4 text-gray-600" /> -->
						<h2 class="text-xl font-semibold text-gray-900">{viewTitle}</h2>
					</div>
					<!-- 페이지 인디케이터 -->
					<div class="flex justify-center gap-1">
						{#each Array(totalViews) as _, index}
							<div
								class="h-1.5 w-1.5 rounded-full transition-colors {currentViewIndex === index
									? 'bg-gray-800'
									: 'bg-gray-300'}"
							></div>
						{/each}
					</div>
				</div>

				<button
					onclick={nextView}
					class="flex h-10 w-10 items-center justify-center rounded-full bg-gray-50 transition-colors hover:bg-gray-100 active:bg-gray-200"
					aria-label="다음 보기"
				>
					<ChevronRight class="h-6 w-6 text-gray-600" />
				</button>
			</div>
		</div>
	</div>

	<div class="mx-auto max-w-lg p-4">
		<!-- 설명 박스 -->
		<div class="mb-4 rounded-lg border border-blue-100 bg-blue-50 p-3">
			<p class="text-center text-sm text-gray-700">
				전국 음식점 추천 링크를 분석한 플랫폼별, 지역별 통계입니다.
			</p>
		</div>
		<!-- 본문 시작 -->
		{#if currentViewIndex === 0}
			<!-- 도메인별 추천 비율 -->
			{#if domainStats.length > 0}
				<div class="mb-4 rounded-lg bg-gray-50 p-4">
					<h4 class="mb-3 text-sm font-medium text-gray-700">플랫폼별 링크 비율</h4>

					<!-- 가로 바 차트 -->
					<div class="mb-3">
						<div class="h-6 w-full overflow-hidden rounded-full bg-gray-200">
							{#each domainStats as domain, index}
								<div
									class="float-left h-full {colors[
										index % colors.length
									]} transition-all duration-500"
									style="width: {domain.percentage}%"
									title="{domainToName(domain.domain)}: {Math.round(domain.percentage)}%"
								></div>
							{/each}
						</div>
					</div>

					<!-- 레전드 -->
					<div class="grid grid-cols-2 gap-2">
						{#each domainStats as domain, index}
							<div class="flex items-center gap-2 text-xs">
								<div class="h-3 w-3 rounded-full {colors[index % colors.length]}"></div>
								<span class="flex-1 truncate text-gray-700">{domainToName(domain.domain)}</span>
								<span class="text-gray-600">{Math.round(domain.percentage)}%</span>
							</div>
						{/each}
					</div>
				</div>
			{/if}
		{/if}

		<!-- 현황 요약 -->
		<div class="mb-4 rounded-lg bg-gray-50 p-4">
			<h4 class="mb-3 text-sm font-medium text-gray-700">
				<!-- {currentViewIndex === 0 ? '전국 현황' : `${viewLabel} 현황`} -->
				<!-- {currentViewIndex === 0 ? '전국' : `${viewLabel}`} -->
			</h4>
			<div class="grid grid-cols-3 gap-4 text-center">
				<div>
					<p class="text-2xl font-bold text-gray-900">
						<!-- 링크에 소개개된 음식점 수, 콘텐츠 영상 또는 링크/댓글에 소개된 음식점 수 -->
						{formatNumber(currentData.totalRecommendations)}
					</p>
					<p class="text-xs text-gray-500">음식점 수</p>
				</div>
				<div>
					<p class="text-2xl font-bold text-gray-900">
						{formatNumber(currentData.totalRestaurants)}
					</p>
					<p class="text-xs text-gray-500">링크 수</p>
				</div>
				<div>
					<p class="text-2xl font-bold text-gray-900">{formatNumber(currentData.totalUsers)}</p>
					<p class="text-xs text-gray-500">참여자 수</p>
				</div>
			</div>
		</div>

		<!-- 인기 카테고리 -->
		<div class="mb-4">
			<div class="mb-3 flex items-center justify-between">
				<h4 class="font-medium text-gray-900">인기 음식 카테고리 TOP 10</h4>
				{#if currentData.topCategories.length > 4}
					<button
						onclick={() => (showAllCategories = !showAllCategories)}
						class="flex items-center gap-1 text-xs text-gray-600 transition-colors hover:text-gray-800"
					>
						<span>
							{showAllCategories ? '접기' : `+${currentData.topCategories.length - 4}개 더보기`}
						</span>
						<ChevronDown
							class="h-3 w-3 transform transition-transform {showAllCategories ? 'rotate-180' : ''}"
						/>
					</button>
				{/if}
			</div>
			<div class="space-y-2">
				{#each displayedCategories as category, index}
					<div class="flex items-center gap-3">
						<div class="w-6 text-center text-sm text-gray-500">{index + 1}</div>
						<div class="w-16 truncate text-sm text-gray-600">{category.name}</div>
						<div class="relative flex-1">
							<div class="h-5 w-full overflow-hidden rounded-full bg-gray-100">
								<div
									class="h-full rounded-full bg-gray-800 transition-all duration-500"
									style="width: {category.percentage}%"
								></div>
							</div>
						</div>
						<div class="w-12 text-right text-xs text-gray-500">{category.count}</div>
					</div>
				{/each}
			</div>
		</div>

		<!-- 인기 지역 -->
		<div class="mb-4">
			<div class="mb-3 flex items-center justify-between">
				<h4 class="font-medium text-gray-900">지역</h4>
				{#if currentData.topRegions.length > 4}
					<button
						onclick={() => (showAllRegions = !showAllRegions)}
						class="flex items-center gap-1 text-xs text-gray-600 transition-colors hover:text-gray-800"
					>
						<span>
							{showAllRegions ? '접기' : `+${currentData.topRegions.length - 4}개 더보기`}
						</span>
						<ChevronDown
							class="h-3 w-3 transform transition-transform {showAllRegions ? 'rotate-180' : ''}"
						/>
					</button>
				{/if}
			</div>
			<div class="space-y-2">
				{#each displayedRegions as region, index}
					<div class="flex items-center justify-between rounded bg-gray-50 p-2">
						<div class="flex items-center gap-2">
							<span class="text-sm text-gray-500">{region.rank}</span>
							<span class="text-sm font-medium text-gray-900">{region.name}</span>
						</div>
						<span class="text-sm text-gray-600">{formatNumber(region.count)}곳</span>
					</div>
				{/each}
			</div>
		</div>

		<!-- 통계 인사이트
		<div class="rounded-lg bg-gray-50 p-4">
			<h4 class="mb-3 text-sm font-medium text-gray-700">통계 인사이트</h4>
			<div class="space-y-2">
				<div class="flex items-center gap-2 text-xs">
					<div class="h-2 w-2 rounded-full bg-gray-800"></div>
					<span class="text-gray-600">
						가장 인기: {currentData.topCategories[0]?.name || '데이터 없음'} ({currentData.topCategories[0]?.percentage.toFixed(
							1,
						) || '0'}%)
					</span>
				</div>
				<div class="flex items-center gap-2 text-xs">
					<div class="h-2 w-2 rounded-full bg-gray-800"></div>
					<span class="text-gray-600">
						추천 1위 지역: {currentData.topRegions[0]?.name || '데이터 없음'}
					</span>
				</div>
				<div class="flex items-center gap-2 text-xs">
					<div class="h-2 w-2 rounded-full bg-gray-800"></div>
					<span class="text-gray-600">
						평균 사용자당 {(currentData.totalRecommendations / currentData.totalUsers).toFixed(1)}개
						추천
					</span>
				</div>
				{#if currentViewIndex !== 0}
					<div class="flex items-center gap-2 text-xs">
						<div class="h-2 w-2 rounded-full bg-gray-800"></div>
						<span class="text-gray-600">
							{viewLabel} 플랫폼별 통계
						</span>
					</div>
				{/if}
			</div>
		</div>
	</div>-->
	</div>
</article>
