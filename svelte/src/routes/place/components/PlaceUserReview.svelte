<script lang="ts">
	import { requestCommunityMetaService } from '$lib/api/community-meta.service';
	import { requestYouTubeMetaService } from '$lib/api/ytube-meta.service';
	import { supabase } from '$lib/supabase';
	import { placeService } from '$services/place.service';
	import { authStore } from '$services/auth.store';
	import type {
		UserProfile,
		Place,
		Feature,
		YouTubeVideoSnippet,
		CommunityMetaInfo,
	} from '$services/types';
	import { ago, safeFormatDate } from '$utils/date.util';
	import { fly } from 'svelte/transition';
	import Icon from '$lib/components/Icon.svelte';
	import * as Alert from '$lib/components/ui/alert/index.js';
	import * as ConfirmDialog from '$lib/components/ui/confirm-dialog/index.js';

	let { place, isAuthenticated }: { place: Place; isAuthenticated: boolean } = $props();

	let currentUser = $state<UserProfile | null>(null);
	// 요청 처리상태
	let isRequestProcessing = $state(false);
	// edge function 에서 클리앙 콘텐츠 호출 문제가 있긴한데, 5회정도만 잘 받아옴..
	let retryCount = $state(0);
	let maxRetries = $state(10);

	interface ReviewTag {
		code: string;
		label: string;
		is_positive: boolean;
		group: string;
	}

	interface PlaceUserReview {
		id: string; // uuid
		user_id: string; // uuid
		place_id: string;
		review_content: string;
		score: number;
		media_urls: string[] | null;
		gender_code: 'M' | 'F' | null;
		age_group_code: '10s' | '20s' | '30s' | '40s' | '50s+' | null;
		is_private: boolean;
		is_active: boolean;
		created_at: string; // timestamptz
		updated_at: string; // timestamptz
		is_my_review: boolean;
		tags: ReviewTag[];
		user_profile: UserProfile | null;
	}

	// --- Component State ---
	let placeFeatures = $state<Feature[]>([]);
	$effect(() => {
		placeFeatures = place?.features ?? [];
		if (place.id) {
			loadReviews();
			// loadPlaceFeatures();
		}
	});

	$effect(() => {
		const unsubscribe = authStore.subscribe((state) => {
			// console.log('authStore', state.profile);
			currentUser = state.profile;
		});
		return unsubscribe;
	});

	let isLoading = $state(false);
	let error = $state<string | null>(null);

	// --- UI State ---
	let showReviewForm = $state(false);
	let activeContentTab = $state<'youtube' | 'community'>('youtube');

	// --- Form State ---
	let rating = $state(0);
	let comment = $state('');
	let selectedTagCodes = $state<string[]>([]);
	let isPrivate = $state(false);
	let gender: 'M' | 'F' | null = $state(null);
	let ageGroup: '10s' | '20s' | '30s' | '40s' | '50s+' | null = $state(null);
	let showDemographicsForm = $state(false);
	let initialGender: 'M' | 'F' | null | undefined = $state(undefined);
	let initialAgeGroup: '10s' | '20s' | '30s' | '40s' | '50s+' | null | undefined =
		$state(undefined);

	$effect(() => {
		if (showReviewForm) {
			const g = currentUser?.gender_code ?? null;
			const a = currentUser?.age_group_code ?? null;
			gender = g;
			ageGroup = a;
			initialGender = g;
			initialAgeGroup = a;
			showDemographicsForm = false;
		}
	});

	// --- Feature Management (YouTube/Community) ---
	let showYoutubeAddForm = $state(false);
	let youtubeUrlInput = $state('');
	let showCommunityAddForm = $state(false);
	let communityUrlInput = $state('');
	let editingFeatureId = $state<string | null>(null);
	let editingUrl = $state('');

	// --- Mock User & Data ---
	// const currentUser = { id: 'b75408a1-c1cf-43b6-b6f1-3b7288745b62' }; // Sample user

	// Mock data for submitted reviews
	let reviews = $state<PlaceUserReview[]>([]);

	let showAllReviews = $state(false);
	let editingReviewId: string | null = $state(null);

	// Alert Dialog 상태 관리
	let showDeleteConfirm = $state(false);
	let reviewToDelete: string | null = $state(null);
	let showSuccessAlert = $state(false);
	let showErrorAlert = $state(false);
	let alertMessage = $state('');

	let showDeleteCommunity = $state(false);
	let communityToDelete: string | null = $state(null);

	// Auto-hide alert after 3 seconds
	$effect(() => {
		if (showSuccessAlert) {
			const timer = setTimeout(() => {
				showSuccessAlert = false;
			}, 3000);
			return () => clearTimeout(timer);
		}
	});

	$effect(() => {
		if (showErrorAlert) {
			const timer = setTimeout(() => {
				showErrorAlert = false;
			}, 5000);
			return () => clearTimeout(timer);
		}
	});

	// state for the inline editing form
	let editingRating = $state(0);
	let editingComment = $state('');
	let editingTagCodes = $state<string[]>([]);
	let editingIsPrivate = $state(false);

	const availableTags = [
		{ code: 'local', label: '지역 주민 추천', is_positive: true, group: '추천' },
		{ code: 'frequent', label: '자주 방문', is_positive: true, group: '추천' },
		{ code: 'again', label: '또 오고싶음', is_positive: true, group: '추천' },
		{ code: 'good_atmosphere', label: '분위기 최고', is_positive: true, group: '분위기' },
		{ code: 'good_taste', label: '맛 최고', is_positive: true, group: '맛' },
		{ code: 'with_gf', label: '여자친구랑', is_positive: true, group: '동반자' },
		{ code: 'with_family', label: '가족과', is_positive: true, group: '동반자' },
		{ code: 'alone', label: '혼밥', is_positive: true, group: '동반자' },
		{ code: 'bad_atmosphere', label: '분위기 별로', is_positive: false, group: '분위기' },
		{ code: 'bad_taste', label: '맛 별로', is_positive: false, group: '맛' },
		{ code: 'bad_service', label: '서비스 별로', is_positive: false, group: '서비스' },
	];

	const ageGroupOptions = [
		{ label: '10대', value: '10s' },
		{ label: '20대', value: '20s' },
		{ label: '30대', value: '30s' },
		{ label: '40대', value: '40s' },
		{ label: '50대 이상', value: '50s+' },
	];

	// --- Derived State ---
	let youtubeFeatures = $derived(placeFeatures.filter((f) => f.platform_type === 'youtube'));
	let communityFeatures = $derived(placeFeatures.filter((f) => f.platform_type === 'community'));
	let averageRating = $derived(
		reviews.length > 0 ? reviews.reduce((acc, r) => acc + r.score, 0) / reviews.length : 0,
	);
	let publicReviews = $derived(reviews.filter((r) => !r.is_private || r.is_my_review));
	let displayedReviews = $derived(showAllReviews ? publicReviews : publicReviews.slice(0, 3));

	const hasDemographics = $derived(!!(currentUser?.gender_code && currentUser?.age_group_code));
	const demographicInfoChanged = $derived(gender !== initialGender || ageGroup !== initialAgeGroup);

	async function loadReviews() {
		if (!place.id) return;
		isLoading = true;
		error = null;
		try {
			const { data, error: rpcError } = await supabase.rpc('v1_list_place_user_review', {
				p_place_id: place.id,
				p_limit: 100,
			});

			if (rpcError) {
				console.error('리뷰 목록 로드 오류:', rpcError);
				throw new Error('리뷰를 불러오는데 실패했습니다.');
			}
			reviews = data || [];
		} catch (e: any) {
			error = e.message;
		} finally {
			isLoading = false;
		}
	}

	// 유튜브 및 커뮤니티 추천글 목록 조회
	async function loadPlaceFeatures() {
		try {
			isLoading = true;
			error = null;
			const features = await placeService.getPlaceFeatures(place.id);
			placeFeatures = features;
		} catch (err) {
			error = '관련 정보를 불러오는데 실패했습니다.';
			console.error('장소 특징 로드 오류:', err);
		} finally {
			isLoading = false;
		}
	}

	// 유튜브 및 커뮤니티 추천글 추가
	async function addFeature(platform: 'youtube' | 'community') {
		isRequestProcessing = true;
		retryCount = 0;
		const url = platform === 'youtube' ? youtubeUrlInput : communityUrlInput;
		if (!url.trim()) return;

		let title: string | null = null;
		let metadata: YouTubeVideoSnippet | CommunityMetaInfo | null = null;

		try {
			if (platform === 'youtube') {
				let videoId;
				if (url.includes('youtu.be')) {
					videoId = url.split('/').pop()?.split('?')[0];
				} else if (url.includes('/shorts/')) {
					videoId = url.split('/shorts/')[1]?.split('?')[0];
				} else {
					videoId = url.match(/[?&]v=([^&]+)/)?.[1];
				}

				if (!videoId) {
					throw new Error('유효한 YouTube URL이 아닙니다.');
				}
				const { error: metaError, results } = (await requestYouTubeMetaService(videoId)) as {
					error: boolean;
					results: YouTubeVideoSnippet;
				};
				if (metaError || !results) {
					throw new Error('YouTube 영상 정보를 가져올 수 없습니다.');
				}
				title = results.title;
				metadata = results;
			} else if (platform === 'community') {
				// clien.net, damoang.net 도메인만 허용
				const allowedDomains = ['clien.net', 'damoang.net', 'bobaedream.co.kr'];
				const urlDomain = new URL(url).hostname.replace('www.', '');

				if (!allowedDomains.includes(urlDomain)) {
					throw new Error('clien.net, damoang.net, bobaedream.co.kr 링크만 등록 가능합니다.');
				}

				// 커뮤니티 정보 가져오기 재시도 로직
				let communityResults = null;
				for (let attempt = 1; attempt <= maxRetries; attempt++) {
					retryCount = attempt;
					try {
						const { error: metaError, results } = (await requestCommunityMetaService(url)) as {
							error: boolean;
							results: CommunityMetaInfo;
						};
						if (!metaError && results) {
							communityResults = results;
							break;
						}
					} catch (error) {
						console.error(`커뮤니티 정보 가져오기 시도 ${attempt}/${maxRetries} 실패:`, error);
					}

					// 마지막 시도가 아니면 1초 대기
					if (attempt < maxRetries) {
						await new Promise((resolve) => setTimeout(resolve, 1000));
					}
				}

				if (!communityResults) {
					alertMessage = '커뮤니티 정보를 가져올 수 없습니다. 나중에 다시 시도해주세요.';
					showErrorAlert = true;
					return;
				}

				title = communityResults.title;
				metadata = communityResults;
			}

			const { error: rpcError } = await supabase.rpc('v1_upsert_place_feature', {
				p_business_id: place.id,
				p_platform_type: platform,
				p_content_url: url,
				p_title: title,
				p_metadata: metadata,
			});

			if (rpcError) {
				console.error(rpcError);
				throw new Error('정보 추가에 실패했습니다.');
			}

			await loadPlaceFeatures();
			if (platform === 'youtube') {
				youtubeUrlInput = '';
				showYoutubeAddForm = false;
			} else {
				communityUrlInput = '';
				showCommunityAddForm = false;
			}
		} catch (e: any) {
			alertMessage = e.message;
			showErrorAlert = true;
		} finally {
			isRequestProcessing = false;
			retryCount = 0;
		}
	}

	async function deleteCommunity() {
		const { error: rpcError } = await supabase.rpc('v1_delete_place_feature', {
			p_feature_id: communityToDelete,
		});
		if (rpcError) {
			alert('삭제에 실패했습니다.');
			console.error(rpcError);
		} else {
			await loadPlaceFeatures();
		}
		editingUrl = '';
	}

	async function removeFeature(featureId: string) {
		const { error: rpcError } = await supabase.rpc('v1_delete_place_feature', {
			p_feature_id: featureId,
		});
		if (rpcError) {
			alertMessage = '삭제에 실패했습니다.';
			showErrorAlert = true;
			console.error(rpcError);
		} else {
			await loadPlaceFeatures();
		}
	}

	function cancelEdit() {
		editingFeatureId = null;
		editingUrl = '';
	}

	async function saveEdit(feature: Feature) {
		if (!editingUrl.trim() || editingUrl === feature.content_url) {
			cancelEdit();
			return;
		}

		let title = feature.title;
		let metadata: YouTubeVideoSnippet | CommunityMetaInfo | null = (feature as any).metadata;
		try {
			if (feature.platform_type === 'youtube') {
				const videoId = editingUrl.includes('youtu.be')
					? editingUrl.split('/').pop()?.split('?')[0]
					: editingUrl.match(/[?&]v=([^&]+)/)?.[1];

				if (!videoId) {
					throw new Error('유효한 YouTube URL이 아닙니다.');
				}

				const { error: metaError, results } = (await requestYouTubeMetaService(videoId)) as {
					error: boolean;
					results: YouTubeVideoSnippet;
				};
				if (metaError || !results) {
					throw new Error('YouTube 영상 정보를 가져올 수 없습니다.');
				}
				title = results.title;
				metadata = results;
			} else if (feature.platform_type === 'community') {
				const { error: metaError, results } = (await requestCommunityMetaService(editingUrl)) as {
					error: boolean;
					results: CommunityMetaInfo;
				};
				if (metaError || !results) {
					throw new Error('커뮤니티 정보를 가져올 수 없습니다.');
				}
				title = results.title; // ?? getHostname(editingUrl);
				metadata = results;
			}

			const { error: rpcError } = await supabase.rpc('v1_upsert_place_feature', {
				p_feature_id: feature.id,
				p_business_id: place.id,
				p_platform_type: feature.platform_type,
				p_content_url: editingUrl,
				p_title: title,
				p_metadata: metadata,
			});

			if (rpcError) {
				console.error(rpcError);
				throw new Error('수정에 실패했습니다.');
			}
			await loadPlaceFeatures();
			cancelEdit();
		} catch (e: any) {
			alert(e.message);
		}
	}

	function toggleTag(tagValue: string) {
		if (selectedTagCodes.includes(tagValue)) {
			selectedTagCodes = selectedTagCodes.filter((t: string) => t !== tagValue);
		} else {
			selectedTagCodes = [...selectedTagCodes, tagValue];
		}
	}

	function toggleEditTag(tagCode: string) {
		console.log('toggleEditTag', tagCode);
		if (editingTagCodes.includes(tagCode)) {
			editingTagCodes = editingTagCodes.filter((t) => t !== tagCode);
		} else {
			editingTagCodes = [...editingTagCodes, tagCode];
		}
	}

	function resetReviewForm() {
		rating = 0;
		comment = '';
		selectedTagCodes = [];
		gender = null;
		ageGroup = null;
		isPrivate = false;
		showReviewForm = false;
	}

	function toggleReviewForm() {
		showReviewForm = !showReviewForm;
		if (!showReviewForm) {
			resetReviewForm();
		}
	}

	async function handleSaveReview() {
		if (!comment.trim()) {
			alertMessage = '코멘트를 입력해주세요.';
			showErrorAlert = true;
			return;
		}
		if (comment.length > 200) {
			alertMessage = '코멘트는 200자 이내로 입력해주세요.';
			showErrorAlert = true;
			return;
		}

		try {
			const { error: rpcError } = await supabase.rpc('v1_upsert_place_user_review', {
				p_place_id: place.id,
				p_review_content: comment,
				p_score: rating || 0,
				p_is_private: isPrivate,
				p_gender_code: gender,
				p_age_group_code: ageGroup,
				p_tag_codes: selectedTagCodes,
				p_profile_gender_and_age_by_pass: demographicInfoChanged,
			});

			if (rpcError) {
				console.error('리뷰 저장 오류:', rpcError);
				throw new Error('리뷰 저장에 실패했습니다.');
			}

			resetReviewForm();
			await loadReviews();
			alertMessage = '리뷰가 등록되었습니다!';
			showSuccessAlert = true;
		} catch (e: any) {
			alertMessage = e.message;
			showErrorAlert = true;
		}
	}

	function confirmDeleteReview(reviewId: string) {
		reviewToDelete = reviewId;
		showDeleteConfirm = true;
	}

	function confirmDeleteCommunity(featureId: string) {
		communityToDelete = featureId;
		showDeleteCommunity = true;
	}

	async function deleteReview() {
		if (!reviewToDelete) return;

		try {
			const { error: rpcError } = await supabase.rpc('v1_delete_place_user_review', {
				p_review_id: reviewToDelete,
			});

			if (rpcError) {
				console.error('리뷰 삭제 오류:', rpcError);
				throw new Error('리뷰 삭제에 실패했습니다.');
			}
			await loadReviews();
			// alertMessage = '리뷰가 삭제되었습니다.';
			// showSuccessAlert = true;
		} catch (e: any) {
			// alertMessage = e.message;
			// showErrorAlert = true;
		} finally {
			showDeleteConfirm = false;
			reviewToDelete = null;
		}
	}

	function startEditReview(review: PlaceUserReview) {
		console.log('startEditReview', review);
		editingReviewId = review.id;
		editingRating = review.score || 0;
		editingComment = review.review_content;
		editingTagCodes = review.tags.map((t) => t.code);
		editingIsPrivate = review.is_private;
	}

	function cancelEditReview() {
		editingReviewId = null;
	}

	async function saveEditReview(reviewId: string) {
		if (!editingComment.trim()) {
			alert('코멘트를 입력해주세요.');
			return;
		}
		if (editingComment.length > 200) {
			alert('코멘트는 200자 이내로 입력해주세요.');
			return;
		}
		try {
			const { error: rpcError } = await supabase.rpc('v1_upsert_place_user_review', {
				p_review_id: reviewId,
				p_place_id: place.id,
				p_review_content: editingComment,
				p_score: editingRating || 0,
				p_is_private: editingIsPrivate,
				p_tag_codes: editingTagCodes.filter((code) => code != null && code !== ''),
				p_profile_gender_and_age_by_pass: true, // 리뷰 수정에서는 성별/연령 정보 전달 필요 없음
			});

			if (rpcError) {
				console.error('리뷰 수정 오류:', rpcError);
				throw new Error('리뷰 수정에 실패했습니다.');
			}

			await loadReviews();
			cancelEditReview();
		} catch (e: any) {
			alert(e.message);
		}
	}

	// 플랫폼 코드에 따른 이름 반환 함수
	function getPlatformName(code: string): string {
		const platformOptions = [
			{ code: 'damoang.net', name: '다모앙' },
			{ code: 'clien.net', name: '클리앙' },
			{ code: 'bobaedream.co.kr', name: '보배드림' },
			{ code: 'youtube', name: '유튜브' },
		];

		const platform = platformOptions.find((option) => option.code === code);
		return platform ? platform.name : code;
	}
</script>

<!-- <div class="bg-white py-12 sm:py-16"> -->
<div>
	<div>
		<!-- Section Header -->
		<!-- <div class="mx-auto mb-10 max-w-3xl text-center md:mb-12">
			<h2 class="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">방문자 리뷰</h2>
			<p class="mt-3 text-base text-gray-600">
				이 장소에 대한 실제 방문객들의 평가를 확인해 보세요.
			</p>
		</div> -->

		<!-- Review Summary & CTA -->
		<div class="mb-12 rounded-2xl bg-gray-50 p-6 shadow-sm">
			{#if !showReviewForm}
				<div class="flex flex-col items-center justify-between gap-6 md:flex-row">
					{#if reviews.length > 0}
						<div class="flex items-center gap-4">
							<div class="flex items-baseline gap-1.5">
								<span class="text-4xl font-bold text-pink-600">{averageRating.toFixed(1)}</span>
								<span class="text-lg font-medium text-gray-500">/ 5</span>
							</div>
							<div class="border-l border-gray-200 pl-4">
								<div class="flex items-center">
									{#each { length: 5 } as _, i}
										<svg
											class="h-5 w-5 {i < averageRating ? 'text-yellow-400' : 'text-gray-300'}"
											xmlns="http://www.w3.org/2000/svg"
											viewBox="0 0 20 20"
											fill="currentColor"
											aria-hidden="true"
										>
											<path
												d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
											></path>
										</svg>
									{/each}
								</div>
								<p class="mt-1 text-sm text-gray-600">{reviews.length}개의 리뷰 기준</p>
							</div>
						</div>
					{:else}
						<div class="flex-grow text-center md:text-left">
							<p class="font-semibold text-gray-800">아직 작성된 리뷰가 없습니다.</p>
							<p class="mt-0.5 text-sm text-gray-500">
								첫 리뷰를 남겨 이곳에서의 경험을 공유해주세요!
							</p>
						</div>
					{/if}
					<button
						class="inline-flex w-full shrink-0 transform items-center justify-center gap-2 rounded-lg {isAuthenticated
							? 'bg-pink-600 hover:bg-pink-700 focus:ring-pink-500'
							: 'cursor-not-allowed bg-gray-400'} px-5 py-2.5 font-semibold text-white shadow-md transition-all duration-300 ease-in-out {isAuthenticated
							? 'hover:-translate-y-0.5'
							: ''} focus:ring-2 focus:ring-offset-2 focus:outline-none sm:w-auto"
						onclick={isAuthenticated ? toggleReviewForm : undefined}
						disabled={!isAuthenticated}
					>
						<!-- {#if showReviewForm}
						<Icon name="x" class="w-5 h-5" />
						<span>작성 취소</span>
					{:else} -->
						<Icon name="pencil" class="h-5 w-5" />
						<span>리뷰 남기기</span>
						<!-- {/if} -->
					</button>
				</div>
			{/if}

			<!-- Review Form (Collapsible) -->
			{#if showReviewForm}
				<!-- <div class="mt-6 border-gray-200 pt-6" transition:slide={{ duration: 300, easing: sineIn }}> -->
				<div class="border-gray-200">
					<div class="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-6">
						<div class="sm:col-span-6">
							<label for="rating" class="mb-1.5 block text-sm font-medium text-gray-700">
								별점
							</label>
							<div class="flex items-center space-x-1">
								{#each Array(5) as _, i}
									<button
										type="button"
										aria-label={`별점 ${i + 1}점`}
										onclick={() => (rating = i + 1)}
									>
										<svg
											class="h-7 w-7 transition-colors {i < rating
												? 'text-yellow-400'
												: 'text-gray-300 hover:text-yellow-300'}"
											fill="currentColor"
											viewBox="0 0 24 24"
										>
											<path
												d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"
											/>
										</svg>
									</button>
								{/each}
							</div>
						</div>

						<div class="sm:col-span-6">
							<label for="tags" class="mb-2 block text-sm font-medium text-gray-700">
								이 음식점에 대한 느낌을 선택해 주세요
							</label>
							<div class="flex flex-wrap gap-2">
								{#each availableTags as tag}
									<button
										type="button"
										class={`rounded-full px-2.5 py-1 text-sm font-medium transition ${selectedTagCodes.includes(tag.code) ? 'bg-pink-600 text-white ring-2 ring-pink-500 ring-offset-2' : 'bg-gray-200 text-gray-800 hover:bg-gray-300'}`}
										onclick={() => toggleTag(tag.code)}
									>
										{tag.label}
									</button>
								{/each}
							</div>
						</div>

						<div class="sm:col-span-6">
							<div class="mt-4 border-t border-gray-200/75 pt-4">
								{#if hasDemographics && !showDemographicsForm}
									<div class="flex items-center justify-between">
										<p class="text-sm text-gray-600">
											기존에 입력하신 성별/연령 정보로 리뷰가 등록됩니다.
										</p>
										<button
											type="button"
											class="text-sm font-medium text-indigo-600 hover:text-indigo-500"
											onclick={() => (showDemographicsForm = true)}
										>
											정보 수정
										</button>
									</div>
								{:else}
									<p class="text-sm text-gray-700">
										더 나은 통계를 위해 성별, 연령 정보를 알려주세요.
									</p>
									<p class="mt-1 text-xs text-gray-500">
										입력하신 정보는 외부에 공개되지 않으며, 다음 리뷰 작성 시 자동으로 불러옵니다.
									</p>
									<div class="mt-3 grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2">
										<div>
											<label class="mb-2 block text-sm font-medium text-gray-700">성별</label>
											<div class="flex items-center gap-2">
												<button
													type="button"
													class={`w-full rounded-md px-4 py-1.5 text-sm font-medium transition ${gender === 'M' ? 'bg-indigo-600 text-white ring-2 ring-indigo-500 ring-offset-1' : 'bg-gray-200 text-gray-800 hover:bg-gray-300'}`}
													onclick={() => (gender = 'M')}
												>
													남성
												</button>
												<button
													type="button"
													class={`w-full rounded-md px-4 py-1.5 text-sm font-medium transition ${gender === 'F' ? 'bg-indigo-600 text-white ring-2 ring-indigo-500 ring-offset-1' : 'bg-gray-200 text-gray-800 hover:bg-gray-300'}`}
													onclick={() => (gender = 'F')}
												>
													여성
												</button>
											</div>
										</div>
										<div>
											<label class="mb-2 block text-sm font-medium text-gray-700">연령대</label>
											<div class="flex flex-wrap gap-1.5">
												{#each ageGroupOptions as option}
													<button
														type="button"
														class={`rounded px-2.5 py-1 text-xs font-medium transition ${ageGroup === option.value ? 'bg-indigo-600 text-white ring-2 ring-indigo-500 ring-offset-2' : 'bg-gray-200 text-gray-800 hover:bg-gray-300'}`}
														onclick={() =>
															(ageGroup = option.value as '10s' | '20s' | '30s' | '40s' | '50s+')}
													>
														{option.label}
													</button>
												{/each}
											</div>
										</div>
									</div>
								{/if}
							</div>
						</div>

						<div class="sm:col-span-6">
							<label for="comment" class="mb-1 block text-sm font-medium text-gray-700">
								한줄 코멘트
							</label>
							<textarea
								rows={3}
								class="w-full rounded-md border bg-gray-100 px-3 py-2 text-base transition-colors focus:bg-white focus:ring-1 focus:ring-indigo-500 focus:outline-none dark:bg-neutral-700 dark:text-gray-200 dark:focus:bg-neutral-600"
								maxlength="150"
								placeholder="이 집은 분위기가 좋아요! (최대 150자)"
								bind:value={comment}
							></textarea>
						</div>

						<div class="sm:col-span-6">
							<div class="relative flex items-start">
								<div class="flex h-6 items-center">
									<input
										id="is-private"
										aria-describedby="is-private-description"
										name="is-private"
										type="checkbox"
										class="h-4 w-4 rounded border-gray-300 text-pink-600 focus:ring-pink-600"
										bind:checked={isPrivate}
									/>
								</div>
								<div class="ml-3 text-sm leading-6">
									<label for="is-private" class="font-medium text-gray-800">비공개로 설정</label>
									<p id="is-private-description" class="text-xs text-gray-500">
										체크 시 다른 사용자에게 나의 리뷰가 보이지 않으며, 통계 정보에만 익명으로
										반영됩니다.
									</p>
								</div>
							</div>
						</div>
					</div>
					<div class="mt-6 flex justify-end">
						<button
							class="w-full rounded-md bg-pink-600 px-6 py-2 font-semibold text-white transition hover:bg-pink-700 sm:w-auto"
							onclick={handleSaveReview}
						>
							저장
						</button>
					</div>
				</div>
			{/if}
		</div>

		<!-- Main Content Grid -->
		<div class="grid grid-cols-1 gap-x-8 gap-y-12 lg:grid-cols-3">
			<!-- Left Column: User Reviews List -->
			<div class="space-y-6 lg:col-span-2">
				{#if reviews.length > 0}
					{#if publicReviews.length > 0}
						<h3 class="text-xl font-bold tracking-tight text-gray-900">
							모든 리뷰 ({publicReviews.length})
						</h3>
						<div class="space-y-8">
							{#each displayedReviews as review (review.id)}
								<article class="flex items-start gap-4">
									<img
										class="h-10 w-10 rounded-full bg-gray-50"
										src={review.user_profile?.profile_image_url ??
											'https://placehold.co/40x40/d1d5db/111827?text=?'}
										alt=""
									/>
									<div class="flex-1">
										{#if editingReviewId === review.id}
											<!-- Editing View -->
											<!-- <div class="space-y-3"> -->
											<div>
												<div class="flex items-center space-x-1">
													{#each Array(5) as _, i}
														<button
															type="button"
															aria-label={`별점 ${i + 1}점`}
															onclick={() => (editingRating = i + 1)}
														>
															<svg
																class="h-5 w-5 transition-colors {i < editingRating
																	? 'text-yellow-400'
																	: 'text-gray-300 hover:text-yellow-300'}"
																fill="currentColor"
																viewBox="0 0 24 24"
															>
																<path
																	d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"
																/>
															</svg>
														</button>
													{/each}
												</div>

												<div class="flex flex-wrap gap-2">
													{#each availableTags as tag}
														<button
															type="button"
															class={`rounded-full px-2.5 py-1 text-xs font-medium transition ${editingTagCodes.includes(tag.code) ? 'bg-pink-600 text-white ring-2 ring-pink-500 ring-offset-2' : 'bg-gray-200 text-gray-800 hover:bg-gray-300'}`}
															onclick={() => toggleEditTag(tag.code)}
														>
															{tag.label}
														</button>
													{/each}
												</div>

												<textarea
													rows={3}
													class="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-pink-500 focus:outline-none"
													maxlength="150"
													bind:value={editingComment}
												></textarea>

												<div class="relative flex items-start pt-1">
													<div class="flex h-6 items-center">
														<input
															id="editing-is-private-{review.id}"
															name="editing-is-private"
															type="checkbox"
															class="h-4 w-4 rounded border-gray-300 text-pink-600 focus:ring-pink-600"
															bind:checked={editingIsPrivate}
														/>
													</div>
													<div class="ml-3 text-sm leading-6">
														<label
															for="editing-is-private-{review.id}"
															class="font-medium text-gray-800"
														>
															비공개
														</label>
													</div>
												</div>

												<div class="mt-2 flex justify-end gap-2">
													<button
														class="px-3 py-1 text-sm font-semibold text-gray-600 hover:text-gray-900"
														onclick={cancelEditReview}
													>
														취소
													</button>
													<button
														class="rounded-md bg-pink-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-pink-700"
														onclick={() => saveEditReview(review.id)}
													>
														저장
													</button>
												</div>
											</div>
										{:else}
											<!-- Normal View -->
											<div class="flex items-center justify-between">
												<div class="flex items-center gap-x-2">
													<p class="text-sm font-semibold text-gray-900">
														{review.user_profile?.nickname ?? '익명'}
													</p>
													<time
														datetime={new Date(review.created_at).toISOString()}
														class="text-xs text-gray-500"
													>
														{safeFormatDate(review.created_at)}
													</time>
													{#if review.is_private}
														<div title="비공개 리뷰">
															<svg
																class="h-3.5 w-3.5 text-gray-400"
																xmlns="http://www.w3.org/2000/svg"
																viewBox="0 0 20 20"
																fill="currentColor"
															>
																<path
																	fill-rule="evenodd"
																	d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z"
																	clip-rule="evenodd"
																/>
															</svg>
														</div>
													{/if}
												</div>
												<div class="flex items-center gap-x-2 text-xs">
													{#if review.is_my_review}
														<button
															class="font-medium text-gray-500 hover:text-gray-800"
															onclick={() => startEditReview(review)}
														>
															수정
														</button>
														<span class="text-gray-300">|</span>
														<button
															class="font-medium text-gray-500 hover:text-red-600"
															onclick={() => confirmDeleteReview(review.id)}
														>
															삭제
														</button>
													{/if}
												</div>
											</div>
											<div class="my-1 flex items-center">
												{#each { length: 5 } as _, i}
													<svg
														class="h-4 w-4 {i < review.score ? 'text-yellow-400' : 'text-gray-300'}"
														fill="currentColor"
														viewBox="0 0 20 20"
													>
														<path
															d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
														></path>
													</svg>
												{/each}
											</div>
											<p class="text-sm leading-relaxed text-gray-700">
												{review.review_content}
											</p>
											{#if review.tags.length > 0}
												<div class="mt-2 flex flex-wrap gap-2">
													{#each review.tags as tag}
														<span
															class={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset
														${
															tag.is_positive
																? 'bg-pink-50 text-pink-700 ring-pink-600/20'
																: 'bg-blue-50 text-blue-700 ring-blue-600/20'
														}`}
														>
															#{tag.label}
														</span>
													{/each}
												</div>
											{/if}
										{/if}
									</div>
								</article>
							{/each}
						</div>
						{#if publicReviews.length > 3 && !showAllReviews}
							<div class="mt-8 text-center">
								<button
									class="rounded-lg bg-gray-100 px-5 py-2 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-200"
									onclick={() => (showAllReviews = true)}
								>
									리뷰 더보기 ({publicReviews.length - 3}개)
								</button>
							</div>
						{/if}
					{:else}
						<div class="rounded-2xl bg-gray-50/70 px-6 py-16 text-center">
							<svg
								class="mx-auto h-12 w-12 text-gray-400"
								xmlns="http://www.w3.org/2000/svg"
								fill="none"
								viewBox="0 0 24 24"
								stroke-width="1.5"
								stroke="currentColor"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									d="M12 15v-3.75m-3.75 3.75h.008v.008h-.008v-.008zm5.25 0h.008v.008h-.008v-.008zm-8.25-3.75h.008v.008h-.008v-.008zm5.25 0h.008v.008h-.008v-.008zm2.25-3.375a3 3 0 11-6 0 3 3 0 016 0z"
								></path>
							</svg>
							<h3 class="mt-4 text-lg font-semibold text-gray-900">공개된 리뷰가 없습니다</h3>
							<p class="mt-1 text-sm text-gray-500">현재 모든 리뷰가 비공개로 작성되었습니다.</p>
						</div>
					{/if}
				{/if}
			</div>

			<!-- Right Column: User Content -->
			<!-- <div class="relative h-fit lg:sticky lg:top-24"> -->
			<div class="relative h-fit">
				{#if isRequestProcessing}
					<div
						class="absolute inset-0 z-10 flex items-center justify-center rounded-lg bg-gray-50/80"
					>
						<div class="flex flex-col items-center gap-2">
							<svg
								class="h-6 w-6 animate-spin text-pink-600"
								xmlns="http://www.w3.org/2000/svg"
								fill="none"
								viewBox="0 0 24 24"
							>
								<circle
									class="opacity-25"
									cx="12"
									cy="12"
									r="10"
									stroke="currentColor"
									stroke-width="4"
								></circle>
								<path
									class="opacity-75"
									fill="currentColor"
									d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
								></path>
							</svg>
							<span class="text-base font-semibold text-gray-800">
								{#if retryCount > 0}
									처리중...{retryCount}/{maxRetries}
								{:else}
									처리중...
								{/if}
							</span>
						</div>
					</div>
				{/if}
				<h3 class="text-xl font-bold tracking-tight text-gray-900">관련 콘텐츠</h3>
				<div class="mt-5">
					<!-- Content Tabs -->
					<div class="border-b border-gray-200">
						<nav class="-mb-px flex space-x-6" aria-label="Tabs">
							<button
								onclick={() => (activeContentTab = 'youtube')}
								class="shrink-0 border-b-2 px-1 pb-3 text-sm font-medium {activeContentTab ===
								'youtube'
									? 'border-pink-500 text-pink-600'
									: 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'}"
							>
								YouTube ({youtubeFeatures.length})
							</button>
							<button
								onclick={() => (activeContentTab = 'community')}
								class="shrink-0 border-b-2 px-1 pb-3 text-sm font-medium {activeContentTab ===
								'community'
									? 'border-pink-500 text-pink-600'
									: 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'}"
							>
								커뮤니티 ({communityFeatures.length})
							</button>
						</nav>
					</div>

					<!-- Tab Content -->
					<div class="mt-5">
						{#if activeContentTab === 'youtube'}
							<div in:fly={{ y: 20, duration: 250 }} class="space-y-4">
								{#if isAuthenticated}
									<button
										class="w-full rounded-lg border-2 border-dashed border-gray-300 px-4 py-1.5 text-center text-sm text-gray-500 transition hover:border-pink-400 hover:text-pink-500"
										onclick={() => (showYoutubeAddForm = !showYoutubeAddForm)}
										disabled={youtubeFeatures.length >= 6 || showYoutubeAddForm}
									>
										+ YouTube 영상 추가
									</button>
								{/if}

								{#if showYoutubeAddForm}
									<div class="space-y-2 rounded-lg bg-gray-50 p-3">
										<input
											type="text"
											class="w-full rounded-md border border-gray-300 px-3 py-1.5 text-base focus:ring-2 focus:ring-pink-500 focus:outline-none"
											placeholder="유튜브 URL"
											bind:value={youtubeUrlInput}
										/>
										<div class="flex justify-end gap-2">
											<button
												class="rounded-md bg-pink-600 px-3 py-1 text-xs font-medium text-white hover:bg-pink-700"
												onclick={() => addFeature('youtube')}
											>
												추가
											</button>
											<button
												class="rounded-md bg-gray-200 px-3 py-1 text-xs font-medium text-gray-700"
												onclick={() => (showYoutubeAddForm = false)}
											>
												취소
											</button>
										</div>
									</div>
								{/if}

								{#each youtubeFeatures as feature (feature.id)}
									<div class="group relative">
										{#if editingFeatureId === feature.id}
											<div class="space-y-2 rounded-lg bg-gray-50 p-3">
												<input
													type="text"
													class="w-full rounded-md border border-gray-300 px-3 py-1.5 text-base focus:ring-2 focus:ring-pink-500 focus:outline-none"
													bind:value={editingUrl}
												/>
												<div class="flex justify-end gap-2">
													<button
														class="rounded-md bg-pink-600 px-3 py-1 text-xs font-medium text-white"
														onclick={() => saveEdit(feature)}
													>
														저장
													</button>
													<button
														class="rounded-md bg-gray-200 px-3 py-1 text-xs font-medium text-gray-700"
														onclick={cancelEdit}
													>
														취소
													</button>
												</div>
											</div>
										{:else}
											<div class="flex items-start gap-3">
												{#if (feature as any).metadata?.thumbnails?.medium?.url}
													<img
														src={(feature as any).metadata.thumbnails.medium.url}
														alt="썸네일"
														class="h-12 w-16 rounded-md bg-gray-100 object-cover"
													/>
												{/if}
												<div class="min-w-0 flex-1">
													<a
														href={feature.content_url}
														target="_blank"
														rel="noopener noreferrer"
														class="block truncate text-sm text-gray-800 hover:text-pink-600"
														title={feature.title ?? ''}
													>
														{feature.title}
													</a>
													<div class="mt-1 text-xs text-gray-500">
														<!-- by?? {featre.user_profile?.nickname} · {ago(feature.created_at)} -->
														@{feature.metadata?.channelTitle} · {ago(feature.metadata?.publishedAt)}
													</div>
												</div>
												{#if feature.user_id === currentUser?.auth_user_id}
													<div>
														<!-- <button
															class="rounded-full bg-white/50 p-1 px-2 text-xs shadow-sm backdrop-blur-sm hover:bg-white"
															onclick={() => startEdit(feature)}
														>
															수정
														</button> -->
														<button
															class="rounded-full bg-white/50 p-1 px-2 text-xs shadow-sm backdrop-blur-sm hover:bg-white"
															onclick={() => removeFeature(feature.id)}
														>
															삭제
														</button>
													</div>
												{/if}
											</div>
										{/if}
									</div>
								{:else}
									{#if !isLoading}
										<p class="text-sm text-center text-gray-500 py-4">등록된 영상이 없습니다.</p>
									{/if}
								{/each}
							</div>
						{/if}

						{#if activeContentTab === 'community'}
							<div in:fly={{ y: 20, duration: 250 }} class="space-y-3">
								{#if isAuthenticated}
									<button
										class="w-full rounded-lg border-2 border-dashed border-gray-300 px-4 py-1.5 text-center text-sm text-gray-500 transition hover:border-pink-400 hover:text-pink-500"
										onclick={() => (showCommunityAddForm = !showCommunityAddForm)}
										disabled={communityFeatures.length >= 6 || showCommunityAddForm}
									>
										+ 커뮤니티 추천글 추가
									</button>
								{/if}
								{#if showCommunityAddForm}
									<div class="space-y-2 rounded-lg bg-gray-50 p-3">
										<input
											type="text"
											class="w-full rounded-md border border-gray-300 px-3 py-1.5 text-base focus:ring-2 focus:ring-pink-500 focus:outline-none"
											placeholder="커뮤니티 글 URL"
											bind:value={communityUrlInput}
										/>
										<div class="flex justify-end gap-2">
											<button
												class="rounded-md bg-pink-600 px-3 py-1 text-xs font-medium text-white"
												onclick={() => addFeature('community')}
											>
												추가
											</button>
											<button
												class="rounded-md bg-gray-200 px-3 py-1 text-xs font-medium text-gray-700"
												onclick={() => (showCommunityAddForm = false)}
											>
												취소
											</button>
										</div>
									</div>
								{/if}

								{#each communityFeatures as feature (feature.id)}
									<div class="group relative">
										{#if editingFeatureId === feature.id}
											<div class="space-y-2 rounded-lg bg-gray-50 p-3">
												<input
													type="text"
													class="w-full rounded-md border border-gray-300 px-3 py-1.5 text-base focus:ring-2 focus:ring-pink-500 focus:outline-none"
													bind:value={editingUrl}
												/>
												<div class="flex justify-end gap-2">
													<button
														class="rounded-md bg-pink-600 px-3 py-1 text-xs font-medium text-white"
														onclick={() => saveEdit(feature)}
													>
														저장
													</button>
													<button
														class="rounded-md bg-gray-200 px-3 py-1 text-xs font-medium text-gray-700"
														onclick={cancelEdit}
													>
														취소
													</button>
												</div>
											</div>
										{:else}
											<div
												class="flex items-center gap-1 rounded-lg bg-gray-50 p-3 transition-colors hover:bg-gray-100"
											>
												<div
													class="mr-2 flex h-12 w-12 items-center justify-center rounded bg-gray-100 text-xs font-semibold text-gray-600"
												>
													{getPlatformName(feature.metadata?.domain)}
												</div>
												<div class="min-w-0 flex-1">
													<a
														href={feature.content_url}
														target="_blank"
														rel="noopener noreferrer"
														class="block truncate text-sm text-gray-700 hover:text-pink-600"
														title={feature.content_url}
													>
														{feature.title}
													</a>
													<div class="mt-1 text-xs text-gray-500">
														<!-- by? {feature.user_profile?.nickname} · {ago(feature.created_at)} -->
														@{getPlatformName(feature.metadata?.domain)}
														<!-- · {ago(feature.metadata?.publishedAt)} -->
													</div>
												</div>
												{#if feature.user_id === currentUser?.auth_user_id}
													<div>
														<!-- <button
															class="rounded-full bg-white/50 p-1 px-2 text-xs shadow-sm backdrop-blur-sm hover:bg-white"
															onclick={() => startEdit(feature)}
														>
															수정
														</button> -->
														<button
															class="rounded-full bg-white/50 p-1 px-2 text-xs shadow-sm backdrop-blur-sm hover:bg-white"
															onclick={() => confirmDeleteCommunity(feature.id)}
														>
															삭제
														</button>
													</div>
												{/if}
											</div>
										{/if}
									</div>
								{:else}
									{#if !isLoading}
										<p class="text-sm text-center text-gray-500 py-4">등록된 추천글이 없습니다.</p>
									{/if}
								{/each}
							</div>
						{/if}
					</div>
				</div>
			</div>
		</div>
	</div>
</div>

<!-- Delete Confirmation Dialog -->
<ConfirmDialog.Root
	bind:open={showDeleteConfirm}
	title="리뷰 삭제"
	description="정말로 이 리뷰를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다."
	confirmText="삭제"
	cancelText="취소"
	confirmVariant="destructive"
	onConfirm={deleteReview}
	onCancel={() => {
		reviewToDelete = null;
	}}
/>

<ConfirmDialog.Root
	bind:open={showDeleteCommunity}
	title="추천글 삭제"
	description="정말로 이 추천글을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다."
	confirmText="삭제"
	cancelText="취소"
	confirmVariant="destructive"
	onConfirm={deleteCommunity}
	onCancel={() => {
		communityToDelete = null;
	}}
/>
<!--
<script lang="ts">
 import * as AlertDialog from "$lib/components/ui/alert-dialog/index.js";
 import { buttonVariants } from "$lib/components/ui/button/index.js";
</script>

<AlertDialog.Root>
 <AlertDialog.Trigger class={buttonVariants({ variant: "outline" })}>
  Show Dialog
 </AlertDialog.Trigger>
 <AlertDialog.Content>
  <AlertDialog.Header>
   <AlertDialog.Title>Are you absolutely sure?</AlertDialog.Title>
   <AlertDialog.Description>
    This action cannot be undone. This will permanently delete your account
    and remove your data from our servers.
   </AlertDialog.Description>
  </AlertDialog.Header>
  <AlertDialog.Footer>
   <AlertDialog.Cancel>Cancel</AlertDialog.Cancel>
   <AlertDialog.Action>Continue</AlertDialog.Action>
  </AlertDialog.Footer>
 </AlertDialog.Content>
</AlertDialog.Root>
-->

<!-- Success Alert -->
<!-- {#if showSuccessAlert}
	<div class="fixed right-4 bottom-4 z-50 max-w-sm">
		<Alert.Root class="border-green-200 bg-green-50">
			<svg
				class="h-4 w-4 text-green-600"
				xmlns="http://www.w3.org/2000/svg"
				fill="none"
				viewBox="0 0 24 24"
				stroke-width="1.5"
				stroke="currentColor"
			>
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
				/>
			</svg>
			<Alert.Title class="text-green-800">성공</Alert.Title>
			<Alert.Description class="text-green-700">
				{alertMessage}
			</Alert.Description>
			<button
				class="absolute top-2 right-2 text-green-600 hover:text-green-800"
				onclick={() => (showSuccessAlert = false)}
			>
				<svg
					class="h-4 w-4"
					xmlns="http://www.w3.org/2000/svg"
					fill="none"
					viewBox="0 0 24 24"
					stroke-width="1.5"
					stroke="currentColor"
				>
					<path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
				</svg>
			</button>
		</Alert.Root>
	</div>
{/if} -->

<!-- Error Alert -->
{#if showErrorAlert}
	<div class="fixed right-4 bottom-4 z-50 max-w-sm">
		<Alert.Root variant="destructive">
			<svg
				class="h-4 w-4"
				xmlns="http://www.w3.org/2000/svg"
				fill="none"
				viewBox="0 0 24 24"
				stroke-width="1.5"
				stroke="currentColor"
			>
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
				/>
			</svg>
			<Alert.Title>오류</Alert.Title>
			<Alert.Description>
				{alertMessage}
			</Alert.Description>
			<button
				class="text-destructive-foreground absolute top-2 right-2 hover:opacity-80"
				onclick={() => (showErrorAlert = false)}
			>
				<svg
					class="h-4 w-4"
					xmlns="http://www.w3.org/2000/svg"
					fill="none"
					viewBox="0 0 24 24"
					stroke-width="1.5"
					stroke="currentColor"
				>
					<path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
				</svg>
			</button>
		</Alert.Root>
	</div>
{/if}
