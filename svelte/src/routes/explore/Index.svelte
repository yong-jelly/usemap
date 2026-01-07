<script lang="ts">
	import { onMount } from 'svelte';
	import SearchPopup from './components/SearchPopup.svelte';
	import PlaceCard from './components/PlaceCard.svelte';
	import PlaceSkeleton from './components/PlaceSkeleton.svelte';
	import ErrorMessage from '$lib/components/explore/ErrorMessage.svelte';
	import { placePopupStore } from '$lib/stores/place-popup.store.svelte';
	import { toggleBottomNav } from '$lib/stores/ui.store';
	import ExploreHeader from './components/ExploreHeader.svelte';
	import CommentSheet from './CommentSheet.svelte';
	import { toggleLoginModal } from '$lib/stores/ui.store';
	import type { PlaceDetailResponse } from './types';
	import { supabase } from '$lib/supabase';
	import type { ExplorerFilterState, Place, SupabaseComment } from '$services/types';
	import {
		getCurrentLocation,
		getLocationCacheKey,
		splitToRegionAddress,
	} from '$utils/location.util';
	import { bucketStore } from '$lib/stores/bucket.store';
	import { requestMyLocationService } from '$lib/api/location.service';
	import { setToggleLike, setToggleSave } from '$services/supabase/interactions.service';
	import { supabaseCommentService } from '../../services/supabase/comment.service';
	import { authStore } from '$services/auth.store';
	import { searchPlaceService } from '$lib/api/supabase-function';
	import { createQuery, fail, succeed } from 'svelte-tiny-query';
	// 한번에 요청될 갯수
	const pageSize = 20;

	// 최초 진입 시 현재 위치 시트 오픈
	let isFirstOpenMyLocationSheetOpen = $state(false);

	// 내부 상태 관리 (북마크, 조회수, 좋아요, 댓글, 길찾기 폴딩)
	let bookmarkedPlaces = $state<Record<string, boolean>>({});
	let commentCounts = $state<Record<string, number>>({});

	// 검색 관련 상태
	let isSearchPopupOpen = $state(false);
	let currentSearchQuery = $state('');
	// 검색후 사용자가 종료하지 않으면 계속 검색된 데이터를 보여주기 위해 사용
	let isExitSearchMode = $state(false);

	// 댓글 Sheet 상태 및 더미 데이터
	let isCommentSheetOpen = $state(false);
	let commentSheetPlaceId = $state<string | null>(null);
	let commentInput = $state('');
	let isLoggedIn = $state(true); // 실제 로그인 연동 전까지 false로 고정

	// 검색 모드 상태 관리
	let viewMode = $state<'city' | 'category' | 'search' | 'filter'>('city');

	// 검색 모드 상태 관리
	let searchPlaces = $state<Place[]>([]);
	// 검색 로딩 상태
	let isSearchLoading = $state(false);
	// 에러 상태 관리
	let errorState = $state<{
		type: 'timeout' | 'network' | 'no-results' | 'unknown' | null;
		message?: string;
	}>({ type: null });

	// 페이지 번호 관련 상태
	let pageNumbers = $state<number[]>([1]);

	// 북마크 처리 진행상태
	let isToggleSaveProcessing = $state(false);
	// 좋아요 처리 진행상태
	let isToggleLikeProcessing = $state(false);

	// 기본 필터 상태 정의
	const defaultFilters = <ExplorerFilterState>{
		rating: null,
		categories: [],
		features: [],
		group1: '서울',
		group2: '중구',
		group3: '태평로1가',
		themes: null,
		nearMe: false,
		radius: 5,
		currentLocation: '',
		youtubeChannels: [],
	};

	// 필터 관련 상태
	let filters = $state<ExplorerFilterState>({
		rating: null,
		categories: [],
		features: [],
		group1: '서울',
		group2: '중구',
		group3: '태평로1가',
		themes: null,
		nearMe: false,
		radius: 5,
		currentLocation: '',
		youtubeChannels: [],
	});

	function exitSearchMode() {
		viewMode = 'city';
		currentSearchQuery = '';
		searchPlaces = [];
		isExitSearchMode = true;
	}

	authStore.subscribe((state) => {
		isLoggedIn = state.isAuthenticated;
	});

	const placesQuery = createQuery(
		({ filters, page }: { filters: ExplorerFilterState; page: number }) => [
			'places',
			JSON.stringify(filters),
			String(page),
		],
		async ({ filters, page }: { filters: ExplorerFilterState; page: number }) => {
			const check = (group: string | null | undefined) => {
				if (group === '전체' || group === null || group === undefined || group === '') {
					return null;
				}
				return group;
			};
			const { data, error: rpcError } = await supabase.rpc('v1_list_places_by_filters', {
				p_group1: check(filters.group1),
				p_group2: check(filters.group2),
				p_group3: check(filters.group3),
				p_category: filters.categories && filters.categories.length > 0 ? filters.categories : null,
				p_convenience: filters.features && filters.features.length > 0 ? filters.features : null,
				p_limit: pageSize,
				p_offset: (page - 1) * pageSize,
				p_theme_code: filters.themes,
				p_exclude_franchises: true,
			});

			if (rpcError) {
				console.error('음식점 목록 조회 실패:', rpcError);
				// 에러 상태 설정
				if (rpcError?.code === '57014' || rpcError?.message?.includes('timeout')) {
					errorState = { type: 'timeout', message: rpcError.message };
				} else if (rpcError?.message?.includes('network') || rpcError?.message?.includes('fetch')) {
					errorState = { type: 'network', message: rpcError.message };
				} else {
					errorState = { type: 'unknown', message: rpcError.message };
				}
				return fail(rpcError);
			}

			// 반환 데이터 타입 정의 (간단하게)
			interface RpcResponseItem {
				place_data: PlaceDetailResponse;
			}

			// data는 place_data 필드를 가진 객체의 배열로 반환됨
			const newPlaces = (data as RpcResponseItem[]).map(
				(item) => item.place_data as unknown as Place,
			);

			return succeed(newPlaces);
		},
		{ staleTime: 60 * 1000 }, // 1분
	);

	// When filters change, reset pagination and error state
	$effect(() => {
		// This effect runs when filters change.
		// By using $inspect, you can see the changes in the Svelte DevTools.
		// $inspect(filters);
		// if (viewMode !== 'search') {
		// 	pageNumbers = [1];
		// }

		// 필터 변경 시 에러 상태 초기화
		if (errorState.type) {
			errorState = { type: null };
		}
	});

	const pageQueries = $derived(
		pageNumbers.map((page) => {
			const { query } = placesQuery({ filters, page });
			return query;
		}),
	);

	const places: Place[] = $derived(pageQueries.flatMap((q) => q.data || []));

	const isInitialLoading = $derived(
		viewMode !== 'search' && pageQueries.length === 1 && pageQueries[0].loading,
	);
	const isMoreLoading = $derived(
		viewMode !== 'search' && pageQueries.length > 1 && pageQueries[pageQueries.length - 1].loading,
	);

	const lastPageQuery = $derived(pageQueries.at(-1));
	const isNoMoreData = $derived(
		(viewMode === 'search' && searchPlaces.length > 0) ||
			(viewMode !== 'search' &&
				lastPageQuery?.data != null &&
				lastPageQuery.data.length < pageSize),
	);

	// 전체 로딩 상태 (스크립트에서 사용하기 위한 별도 정의)
	const isLoading = $derived(viewMode === 'search' ? isSearchLoading : isInitialLoading);

	// 북마크 토글 함수
	async function toggleBookmark(placeId: string, event: Event) {
		event.stopPropagation();
		// bookmarkedPlaces[placeId] = !bookmarkedPlaces[placeId];
		// 로그인 확인
		if (!isLoggedIn) {
			toggleLoginModal({ isOpen: true });
			return;
		}
		if (isToggleSaveProcessing) return;
		isToggleSaveProcessing = true;
		try {
			const isSaved = await setToggleSave(placeId, 'place', placeId);
			// 검색과 일반 목록 구분
			const places_list = viewMode === 'search' ? searchPlaces : places;
			const placeIndex = places_list.findIndex((place) => place.id === placeId);
			if (placeIndex !== -1 && places_list[placeIndex]?.interaction) {
				const interaction = places_list[placeIndex].interaction;
				interaction.is_saved = isSaved;
				interaction.place_saved_count = isSaved
					? (interaction.place_saved_count || 0) + 1
					: Math.max((interaction.place_saved_count || 0) - 1, 0);
			}
			// bookmarkedPlaces[placeId] = isSaved;
		} catch (error) {
			console.error('북마크 처리 실패:', error);
		} finally {
			isToggleSaveProcessing = false;
		}
	}

	// 좋아요 토글 함수
	async function toggleLike(placeId: string, event: Event) {
		event.stopPropagation();
		// 로그인 확인
		if (!isLoggedIn) {
			toggleLoginModal({ isOpen: true });
			return;
		}
		if (isToggleLikeProcessing) return;
		isToggleLikeProcessing = true;
		try {
			const isLiked = await setToggleLike(placeId, 'place', placeId);
			// 검색과 일반 목록 구분
			const places_list = viewMode === 'search' ? searchPlaces : places;
			// 좋아요 상태 업데이트
			const placeIndex = places_list.findIndex((place) => place.id === placeId);
			if (placeIndex !== -1 && places_list[placeIndex]?.interaction) {
				const interaction = places_list[placeIndex].interaction;
				interaction.is_liked = isLiked;
				interaction.place_liked_count = isLiked
					? (interaction.place_liked_count || 0) + 1
					: Math.max((interaction.place_liked_count || 0) - 1, 0);
			}
		} catch (error) {
			console.error('좋아요 처리 실패:', error);
		} finally {
			isToggleLikeProcessing = false;
		}
	}

	// 댓글 버튼 클릭 함수
	function commentClick(placeId: string, event: Event) {
		event.stopPropagation();
		openCommentSheet(placeId);
	}

	// 외부 링크 클릭 시 이벤트 전파 중지

	// 장소 상세 페이지로 이동 및 조회수 증가
	function goToPlaceDetail(placeId: string, event: Event) {
		// console.log('[goToPlaceDetail]', placeId);
		event.preventDefault();
		// 공통 팝업 서비스 사용
		placePopupStore.show(placeId);
	}

	// 더 보기
	async function next() {
		if (isMoreLoading || isNoMoreData) return;
		pageNumbers = [...pageNumbers, pageNumbers.length + 1];
	}

	// 1초 이상 로딩 상태 감지
	let showLoadingMessage = $state(false);
	let loadingTimer: NodeJS.Timeout | null = null;

	$effect(() => {
		if (isLoading) {
			// 로딩이 시작되면 1초 후 메시지 표시
			loadingTimer = setTimeout(() => {
				showLoadingMessage = true;
			}, 1000);
		} else {
			// 로딩이 끝나면 타이머 클리어 및 메시지 숨김
			if (loadingTimer) {
				clearTimeout(loadingTimer);
				loadingTimer = null;
			}
			showLoadingMessage = false;
		}

		// 클린업
		return () => {
			if (loadingTimer) {
				clearTimeout(loadingTimer);
			}
		};
	});

	// 검색 이벤트 핸들러
	function handleSearch(event: CustomEvent<{ query: string }> | { detail: { query: string } }) {
		const { query } = 'detail' in event ? event.detail : event;
		currentSearchQuery = query;

		// 검색 실행
		isSearchPopupOpen = false;
		toggleBottomNav({ isOpen: true });
		executeSearchQuery(query);
	}

	// 히스토리 관리용 상태
	let hasAddedHistoryForPopup = $state(false);

	// 검색 팝업 관리
	function toggleSearchPopup(isOpen?: boolean, skipHistory = false) {
		const newIsOpen = isOpen !== undefined ? isOpen : !isSearchPopupOpen;

		if (newIsOpen && !isSearchPopupOpen) {
			// 팝업 열기: 히스토리 엔트리 추가
			if (typeof window !== 'undefined' && window.history) {
				window.history.pushState({ searchPopup: true }, '', window.location.href);
				hasAddedHistoryForPopup = true;
			}
		} else if (!newIsOpen && isSearchPopupOpen && hasAddedHistoryForPopup && !skipHistory) {
			// 팝업 닫기: 프로그래밍적으로 닫는 경우 히스토리에서 제거 (ESC 키 등은 제외)
			if (typeof window !== 'undefined' && window.history) {
				window.history.back();
				return; // popstate 이벤트에서 실제 상태 변경 처리
			}
		}

		isSearchPopupOpen = newIsOpen;
		toggleBottomNav({ isOpen: newIsOpen ? false : true });

		if (!newIsOpen) {
			// skipHistory가 true이면 직접 히스토리 엔트리 제거
			if (
				skipHistory &&
				hasAddedHistoryForPopup &&
				typeof window !== 'undefined' &&
				window.history
			) {
				// 현재 히스토리 엔트리를 조용히 제거 (페이지 이동 없이)
				window.history.replaceState(null, '', window.location.href);
			}
			hasAddedHistoryForPopup = false;
			if (isExitSearchMode) {
				viewMode = 'city';
			}
		}
	}

	// 검색 쿼리 실행, "id:숫자" 형태인경우 is_search_by_id 처리
	async function executeSearchQuery(query: string) {
		isSearchLoading = true;
		viewMode = 'search';
		searchPlaces = [];
		errorState = { type: null }; // 에러 상태 초기화
		let is_search_by_id = false;
		let searchId = null;
		// query가 "id:숫자" 형태인지 확인
		if (query && query.trim().startsWith('id:')) {
			const idPart = query.trim().substring(3); // "id:" 제거
			if (/^\d+$/.test(idPart)) {
				// 숫자만 있는지 확인
				is_search_by_id = true;
				searchId = parseInt(idPart);
			}
		}
		try {
			if (!is_search_by_id) {
				const searchResult = await searchPlaceService(query, 1, 100);
				console.log('[searchResult]', searchResult);
				// searchResult.then(async (result) => {
				// console.log(result);
				if (searchResult.error) {
					console.error(searchResult.message);
				} else {
					const placeIds = searchResult.items.map((item) => item.id);
					const { data, error } = await supabase.rpc('v1_list_places_by_ids', {
						p_place_ids: placeIds,
					});
					// console.log(data);
					if (error) {
						console.error('장소 정보 조회 실패:', error);
					} else {
						// console.log('장소 정보:', data[0]);
						interface RpcResponseItem {
							place_data: PlaceDetailResponse;
						}
						searchPlaces = data.map((item: RpcResponseItem) => item.place_data as unknown as Place);
						// console.log('[places]', places);
						// places = data.map(item => item.place_data);
					}
				}
				// });
			} else {
				// API 호출
				// 검색어 파싱 (지역#음식점명 형식 처리)
				// let p_name = query;
				// let p_group1 = null;
				// let p_id = null;
				let params = null;
				// if (query.includes('#')) {
				// 	const parts = query.split('#');
				// 	if (parts[0]) {
				// 		p_group1 = parts[0];
				// 		p_name = parts.slice(1).join('#');
				// 	}

				// 	params = {
				// 		p_name: p_name,
				// 		p_group1: p_group1,
				// 		p_limit: 200,
				// 	};
				// } else if (query.includes('&')) {
				// 	const parts = query.split('&');
				// 	if (parts[0]) {
				// 		p_group1 = parts[0];
				// 		is_search_by_id = true;
				// 		p_id = parts[1];
				// 	}
				params = {
					p_id: searchId?.toString().trim(),
				};
				// }

				// Supabase RPC 호출
				const { data, error: rpcError } = await supabase.rpc(
					is_search_by_id ? 'v1_list_places_search_for_id' : 'v1_list_places_search_for_name',
					params,
				);
				if (rpcError) {
					throw rpcError;
				}

				// 반환 데이터 타입 정의
				interface RpcResponseItem {
					place_data: PlaceDetailResponse;
				}

				// 데이터 변환 및 처리
				const newPlaces = (data as RpcResponseItem[]).map((item) => {
					// PlaceDetailResponse를 Place로 변환
					const placeData = item.place_data;
					return {
						...placeData,
						// 필요한 경우 추가 필드 설정
						id: placeData.id || '',
						name: placeData.name || '',
					} as unknown as Place;
				});

				// console.log(`[fetchPlacesByRegion] 지역 '${group1}/${group2}' 결과:`, newPlaces.length);
				searchPlaces = newPlaces;
			}
		} catch (error: any) {
			console.error('지역별 음식점 목록 조회 실패:', error);

			// 에러 타입 분석 및 상태 설정
			if (error?.code === '57014' || error?.message?.includes('timeout')) {
				errorState = { type: 'timeout', message: error.message };
			} else if (error?.message?.includes('network') || error?.message?.includes('fetch')) {
				errorState = { type: 'network', message: error.message };
			} else {
				errorState = { type: 'unknown', message: error.message };
			}
			/*
{
    "code": "57014",
    "details": null,
    "hint": null,
    "message": "canceling statement due to statement timeout"
}
      */
		} finally {
			isSearchLoading = false;
		}
	}

	/**
	 * 현재 내 위치 정보를 기반으로 조회
	 */
	async function fetchPlacesByCurrentLocation() {
		const filter_cache = bucketStore.get('filters', 'explore');
		console.log('[fetchPlacesByCurrentLocation] filter_cache:', filter_cache);
		if (filter_cache) {
			// 각 필드 존재 여부 체크 및 로깅
			console.log('[필터 캐시 체크]');
			console.log('- group1:', filter_cache.get('group1'));
			console.log('- group2:', filter_cache.get('group2'));
			console.log('- group3:', filter_cache.get('group3'));
			console.log('- categories:', filter_cache.get('categories'));
			console.log('- features:', filter_cache.get('features'));
			console.log('- themes:', filter_cache.get('themes'));
		}
		// console.log(filter_cache.);
		// if (filter_cache) {
		//   console.log('[fetchPlacesByCurrentLocation] filter_cache.value:', filter_cache.value);
		// 	Object.assign(filters, filter_cache.value);
		// } else {
		if (filter_cache) {
			const group1 = filter_cache.get('group1');
			const group2 = filter_cache.get('group2');
			const group3 = filter_cache.get('group3');

			if (group1) {
				if (group2) {
					// group1, group2 모두 있는 경우 group3까지 적용
					Object.assign(filters, {
						group1,
						group2,
						group3: group3 || null,
					});
				} else {
					// group2가 없으면 group3는 무시
					Object.assign(filters, {
						group1,
						group2: null,
						group3: null,
					});
				}
			} else {
				// group1이 없으면 기본값 설정
				Object.assign(filters, {
					group1: '서울',
					group2: null,
					group3: null,
				});
			}
		} else {
			// 캐시가 없는 경우 기본값 설정
			Object.assign(filters, defaultFilters);
		}

		// }
		// await fetchPlaces();
		return;
		// 1. region_info 캐시 체크
		const regionCache = bucketStore.get('region_info', 'last_location');
		if (regionCache) {
			const { group1, group2, group3 } =
				regionCache instanceof Map
					? {
							group1: regionCache.get('group1'),
							group2: regionCache.get('group2'),
							group3: regionCache.get('group3'),
						}
					: regionCache;
			console.log('[fetchPlacesByCurrentLocation] regionCache:', regionCache);
			if (group1 && group2) {
				Object.assign(filters, { group1, group2, group3 });
				// await fetchPlaces();
				return;
			}
		}

		// 현재 위치 조회 및 캐시 처리
		const { latitude, longitude } = await getCurrentLocation();
		const key = getLocationCacheKey(latitude, longitude);

		// 2. 위치 정보 조회
		const cached = bucketStore.get('my_geocode', key);
		let legalAddress: string | null = null;

		if (cached) {
			legalAddress = cached instanceof Map ? cached.get('legal') : cached.legal;
		} else {
			try {
				const { address, adm, legal } = await requestMyLocationService(key);
				bucketStore.set('my_geocode', key, { address, adm, legal }, 300); // 5분 캐시
				legalAddress = legal;
			} catch (error) {
				console.error('현재 위치 조회 실패:', error);
				return;
			}
		}

		if (!legalAddress) {
			console.error('유효하지 않은 주소 정보');
			return;
		}

		// 3. 지역 정보 설정 및 캐시 저장
		const { group1, group2, group3 } = splitToRegionAddress(legalAddress!);
		if (!group1 || !group2) {
			console.error('유효하지 않은 지역 정보:', { group1, group2, group3 });
			return;
		}

		// 지역 정보 캐시 저장 (5분)
		bucketStore.set('region_info', 'last_location', { group1, group2, group3 }, 300);

		Object.assign(filters, { group1, group2, group3 });
		// await fetchPlaces();
	}

	// 뒤로가기 이벤트 처리
	function handlePopState(event: PopStateEvent) {
		if (isSearchPopupOpen && hasAddedHistoryForPopup) {
			// 팝업이 열려있고 히스토리 엔트리가 추가된 상태에서 뒤로가기 시 팝업 닫기
			isSearchPopupOpen = false;
			hasAddedHistoryForPopup = false;
			toggleBottomNav({ isOpen: true });

			if (isExitSearchMode) {
				viewMode = 'city';
			}
		}
	}

	onMount(() => {
		fetchPlacesByCurrentLocation();

		// popstate 이벤트 리스너 추가
		if (typeof window !== 'undefined') {
			window.addEventListener('popstate', handlePopState);
		}

		// 클린업 함수 반환
		return () => {
			if (typeof window !== 'undefined') {
				window.removeEventListener('popstate', handlePopState);
			}
		};
	});
	// select v1_list_places_by_ids(ARRAY['16870210','16870210'])

	// 댓글 Sheet 오픈 핸들러
	function openCommentSheet(placeId: string) {
		commentSheetPlaceId = placeId;
		isCommentSheetOpen = true;
		fetchComments(placeId);
		toggleBottomNav({ isOpen: false });
	}
	function closeCommentSheet() {
		isCommentSheetOpen = false;
		commentSheetPlaceId = null;
		commentInput = '';
		toggleBottomNav({ isOpen: true });
	}

	// 댓글 입력 핸들러 (실제 저장X, UI만)
	function handleCommentInput(e: Event) {
		commentInput = (e.target as HTMLInputElement).value;
	}

	let comments = $state<SupabaseComment[]>([]);
	let isCommentsLoading = $state(false);
	let replyTo = $state<SupabaseComment | null>(null);

	// 댓글 목록 fetch 함수
	async function fetchComments(placeId: string) {
		isCommentsLoading = true;
		const { data } = await supabaseCommentService.getCommentsForPlace(placeId);
		comments = (data as SupabaseComment[]) || [];
		isCommentsLoading = false;
	}

	// 댓글 시트 오픈 시 댓글 목록 fetch
	$effect(() => {
		// if (isCommentSheetOpen && commentSheetPlaceId) {
		// 	fetchComments(commentSheetPlaceId);
		// 	replyTo = null;
		// }
	});

	// 댓글 좋아요 토글 핸들러
	async function handleCommentLike(commentId: string) {
		comments = comments.map((comment) =>
			comment.id === commentId ? { ...comment, is_liked: !comment.is_liked } : comment,
		);
	}

	// 답글 상태 핸들러
	function handleReply(comment: SupabaseComment) {
		replyTo = comment;
	}

	// 댓글 등록 핸들러 (답글 포함)
	async function handleCommentSubmit() {
		if (!commentInput.trim() || !commentSheetPlaceId) return;
		await supabaseCommentService.createCommentForPlace({
			business_id: commentSheetPlaceId,
			content: commentInput,
			parent_comment_id: replyTo?.id || undefined,
		});
		commentInput = '';
		replyTo = null;
		fetchComments(commentSheetPlaceId);
	}

	function handleDelete(comment: SupabaseComment) {
		supabaseCommentService.deactivateCommentForPlace(comment.id);
		comments = comments.filter((c) => c.id !== comment.id);
		commentInput = '';
		replyTo = null;
		fetchComments(comment.business_id);
	}
</script>

<!-- 헤더 flex 필터 할려면 pt 필요 -->
<div class="flex min-h-screen flex-col">
	<!-- 탐색 헤더 적용 -->
	<!-- {#if !isSearchPopupOpen} -->
	<div class={isSearchPopupOpen ? 'hidden' : 'block'}>
		<ExploreHeader
			onSearch={(query) => handleSearch({ detail: { query } })}
			onToggleSearchPopup={() => toggleSearchPopup(true)}
			{filters}
			{viewMode}
			onFilterSelect={(filterId, value) => {
				console.log(`필터 선택: ${filterId}`, value);
				if (filterId === 'mylocation') {
					console.log('[내 위치] 버튼 클릭됨:', value);
					return;
				}
				if (filterId === 'theme') {
					filters.themes = value;
				} else if (filterId === 'bookmark') {
					// 즐겨찾기 필터 적용 로직
				} else if (filterId === 'categories') {
					filters.categories = value;
				} else if (filterId === 'region') {
					filters.group1 = value.group1;
					filters.group2 = value.group2;
					filters.group3 = value.group3;
				} else if (filterId === 'convenience') {
					filters.features = value;
				} else if (filterId === 'rating') {
					filters.rating = value;
				}
				// fetchPlaces();
				bucketStore.set('filters', 'explore', filters, 0);
			}}
			onEvent={(event) => {
				console.log('FilterButtonGroup 이벤트:', event);
			}}
			onFilterStart={() => {
				isFirstOpenMyLocationSheetOpen = false;
			}}
			{isFirstOpenMyLocationSheetOpen}
		/>
	</div>
	<!-- {/if} -->

	<!-- 검색 팝업 -->
	<SearchPopup
		isOpen={isSearchPopupOpen}
		searchQuery={currentSearchQuery}
		onClose={(skipHistory = false) => toggleSearchPopup(false, skipHistory)}
		onSearch={(query) => handleSearch({ detail: { query } })}
	/>

	<!-- 메인 콘텐츠 -->
	<div class="flex-1 overflow-auto bg-gray-50 dark:bg-neutral-900">
		<div class="mx-auto max-w-lg pt-2">
			{#if isSearchPopupOpen}
				<!-- 필터나 검색 팝업이 열려있을 때 콘텐츠 숨김 -->
			{:else}
				{@const displayedPlaces = viewMode === 'search' ? searchPlaces : places}
				{@const isLoading = viewMode === 'search' ? isSearchLoading : isInitialLoading}
				<!-- 결과 목록 -->
				{#if isLoading && displayedPlaces.length === 0}
					<!-- 지역 필터 안내 메시지 -->
					{#if filters.group2 === '전체' || showLoadingMessage}
						<div
							class="mx-4 my-3 rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-900/20"
						>
							<div class="flex items-start gap-3">
								<div class="mt-0.5 flex-shrink-0">
									<svg
										xmlns="http://www.w3.org/2000/svg"
										class="h-5 w-5 text-amber-600 dark:text-amber-400"
										viewBox="0 0 24 24"
										fill="none"
										stroke="currentColor"
										stroke-width="2"
										stroke-linecap="round"
										stroke-linejoin="round"
									>
										<path
											d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
										/>
									</svg>
								</div>
								<div class="flex-1">
									<h4 class="text-sm font-medium text-amber-800 dark:text-amber-200">
										조회 속도가 느리신가요?
									</h4>
									<p class="mt-1 text-sm text-amber-700 dark:text-amber-300">
										지역을 '시/군/구' 단위로 좁혀보세요.
									</p>
								</div>
							</div>
						</div>
					{/if}

					<!-- 스켈레톤 UI 표시 (자연스러운 로딩 경험) -->
					<div class="px-4">
						<PlaceSkeleton count={5} />
					</div>
				{:else if displayedPlaces.length === 0}
					{#if errorState.type}
						<ErrorMessage
							type={errorState.type}
							searchQuery={viewMode === 'search' ? currentSearchQuery : undefined}
							onRetry={() => {
								errorState = { type: null };
								if (viewMode === 'search') {
									executeSearchQuery(currentSearchQuery);
								} else {
									// 일반 목록 새로고침
									pageNumbers = [1];
								}
							}}
							onClearFilters={() => {
								errorState = { type: null };
								filters = { ...defaultFilters };
								bucketStore.set('filters', 'explore', filters, 0);
								pageNumbers = [1];
							}}
						/>
					{:else}
						<ErrorMessage
							type="no-results"
							searchQuery={viewMode === 'search' ? currentSearchQuery : undefined}
							onClearFilters={() => {
								filters = { ...defaultFilters };
								bucketStore.set('filters', 'explore', filters, 0);
								pageNumbers = [1];
							}}
						/>
					{/if}
				{:else}
					{#if viewMode === 'search' && currentSearchQuery}
						<div
							class="mx-4 my-3 rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20"
						>
							<div class="flex items-center justify-between">
								<div class="flex items-center gap-2">
									<div class="h-2 w-2 rounded-full bg-blue-500"></div>
									<span class="text-sm font-semibold text-blue-800 dark:text-blue-200">
										'{currentSearchQuery}' 검색 결과
									</span>
									<!-- <span class="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full dark:bg-blue-800 dark:text-blue-200">
										{displayedPlaces.length}개
									</span> -->
								</div>
								<button
									class="flex items-center gap-1 rounded-md border bg-white px-3 py-1.5 text-xs font-medium transition-colors"
									onclick={() => exitSearchMode()}
								>
									검색 종료
								</button>
							</div>
						</div>
					{/if}

					<!-- 음식점 카드 목록 -->
					{#each displayedPlaces as place}
						<PlaceCard
							{place}
							{goToPlaceDetail}
							{toggleLike}
							{commentClick}
							{toggleBookmark}
							{commentCounts}
							{bookmarkedPlaces}
							onTagClick={(type, value) => {
								// console.log('[태그/카테고리/그룹 클릭]', type, value);
								// 태그/카테고리/그룹 클릭 시 필터 버튼 그룹에 이벤트 전달
								if (type === 'category') {
									filters.categories = [value];
								} else if (type === 'group1') {
									filters.group1 = value;
									filters.group2 = null;
									filters.group3 = null;
								} else if (type === 'group2') {
									filters.group2 = value;
									filters.group3 = null;
								} else if (type === 'group3') {
									filters.group3 = value;
								} else if (type === 'tag') {
									return;
								}
								// fetchPlaces();
							}}
						/>
					{/each}

					<!-- 더 보기 버튼 -->
					{#if !isMoreLoading && displayedPlaces.length > 0 && !isNoMoreData}
						<div class="flex justify-center py-4">
							<button
								class="flex items-center gap-2 rounded-full bg-white px-6 py-2 text-gray-700 shadow-xs transition-shadow hover:text-gray-900 hover:shadow-md dark:bg-neutral-800 dark:text-gray-300 dark:hover:text-gray-100"
								onclick={next}
							>
								<span>더 보기</span>
								<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M19 9l-7 7-7-7"
									/>
								</svg>
							</button>
						</div>
					{:else if isNoMoreData}
						<div class="flex justify-center py-4">
							<span class="text-sm text-gray-400 dark:text-gray-500">
								더 이상 표시할 항목이 없습니다.
							</span>
						</div>
					{/if}
				{/if}
			{/if}
		</div>
	</div>
</div>

<!-- 댓글 Sheet (BottomSheet 컴포넌트 기반) -->
<CommentSheet
	isOpen={isCommentSheetOpen}
	{comments}
	{isLoggedIn}
	input={commentInput}
	onInput={handleCommentInput}
	onSubmit={handleCommentSubmit}
	onClose={closeCommentSheet}
	onLike={handleCommentLike}
	onReply={handleReply}
	onDelete={handleDelete}
	{replyTo}
	isLoading={isCommentsLoading}
/>

<style>
	/* 스크롤바 숨기기 */
	.scrollbar-hide {
		-ms-overflow-style: none; /* IE and Edge */
		scrollbar-width: none; /* Firefox */
	}
	.scrollbar-hide::-webkit-scrollbar {
		display: none; /* Chrome, Safari, Opera */
	}

	/* SVG 아이콘 스타일 */
	.svg-icon {
		width: 20px;
		height: 20px;
		display: inline-flex;
		align-items: center;
		justify-content: center;
	}

	/* 버튼 비활성화 스타일 */
	button:disabled {
		opacity: 0.7;
		cursor: not-allowed;
	}
</style>
