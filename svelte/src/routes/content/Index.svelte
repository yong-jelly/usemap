<script lang="ts">
	import FeedPost from '../../components/FeedPost.svelte';
	import { onMount } from 'svelte';

	// 임시 데이터
	const posts = [
		{
			id: 'post1',
			username: 'me',
			userAvatar: 'https://i.pravatar.cc/150?img=6',
			postImage: [
				'https://picsum.photos/800/800?random=10',
				'https://picsum.photos/800/800?random=11',
			],
			likes: 127,
			caption: '오늘 새로운 프로젝트 시작했어요! #개발 #프로그래밍',
			comments: 12,
			timestamp: '10분 전',
			communityName: '개발자 모임',
			communityAvatar: 'https://i.pravatar.cc/150?img=15',
			title: '새 프로젝트 시작',
			content:
				'오늘부터 신규 프로젝트를 시작했습니다. 열심히 개발해서 좋은 결과물을 만들어보겠습니다! 많은 응원 부탁드려요. #개발 #프로그래밍',
			link: {
				url: 'https://github.com/myproject',
				title: '내 프로젝트 GitHub 저장소',
			},
			isMyPost: true,
		},
		{
			id: 'post2',
			username: 'user1',
			userAvatar: 'https://i.pravatar.cc/150?img=1',
			postImage: [
				'https://picsum.photos/800/800?random=1',
				'https://picsum.photos/800/800?random=2',
				'https://picsum.photos/800/800?random=3',
			],
			likes: 1234,
			caption: '오늘의 일상 #일상 #데일리',
			comments: 89,
			timestamp: '2시간 전',
			communityName: '일상의 순간',
			communityAvatar: 'https://i.pravatar.cc/150?img=10',
			title: '오늘의 일상 공유',
			content: '오늘은 정말 좋은 날씨네요. 산책도 다녀오고 맛있는 점심도 먹었습니다. #일상 #데일리',
			link: {
				url: 'https://example.com/blog-post',
				title: '블로그 포스트: 오늘의 일상',
			},
		},
		{
			id: 'post3',
			username: 'user2',
			userAvatar: 'https://i.pravatar.cc/150?img=2',
			postImage: null,
			likes: 856,
			caption: '맛있는 점심 #맛집 #점심',
			comments: 45,
			timestamp: '3시간 전',
			communityName: '맛집 탐방',
			communityAvatar: 'https://i.pravatar.cc/150?img=11',
			title: '강남역 맛집 추천',
			content:
				'오늘 발견한 강남역 맛집을 공유합니다. 정말 맛있었어요! 특히 김치찌개가 일품이었습니다. #맛집 #점심',
			link: null,
		},
		{
			id: 'post4',
			username: 'user4',
			userAvatar: 'https://i.pravatar.cc/150?img=4',
			postImage: 'https://picsum.photos/800/800?random=7',
			likes: 756,
			caption: '단독 이미지 #사진',
			comments: 32,
			timestamp: '1시간 전',
			communityName: '사진사랑',
			communityAvatar: 'https://i.pravatar.cc/150?img=13',
			title: '오늘 찍은 사진 한 장',
			content: '오늘 산책하다가 찍은 사진입니다. 너무 예쁘지 않나요? #사진',
			link: null,
		},
		{
			id: 'post5',
			username: 'user5',
			userAvatar: 'https://i.pravatar.cc/150?img=5',
			postImage: [
				'https://picsum.photos/800/800?random=8',
				'https://picsum.photos/800/800?random=9',
			],
			likes: 1520,
			caption: '두 장의 사진 #사진 #이미지',
			comments: 67,
			timestamp: '4시간 전',
			communityName: '사진모음',
			communityAvatar: 'https://i.pravatar.cc/150?img=14',
			title: '오늘의 베스트 샷 두 장',
			content:
				'오늘 촬영한 베스트 사진 두 장을 공유합니다. 어떤 사진이 더 마음에 드시나요? #사진 #이미지',
			link: null,
		},
		{
			id: 'post6',
			username: 'user3',
			userAvatar: 'https://i.pravatar.cc/150?img=3',
			postImage: [
				'https://picsum.photos/800/800?random=4',
				'https://picsum.photos/800/800?random=5',
				'https://picsum.photos/800/800?random=6',
			],
			likes: 2341,
			caption: '주말 나들이 #주말 #나들이',
			comments: 156,
			timestamp: '5시간 전',
			communityName: '주말 나들이',
			communityAvatar: 'https://i.pravatar.cc/150?img=12',
			title: '주말 한강 피크닉',
			content: '오늘 한강에서 피크닉 다녀왔습니다. 날씨가 정말 좋았어요! #주말 #나들이',
			link: null,
		},
	];

	// 스크롤 위치 복원
	onMount(() => {
		console.log('Index 페이지 마운트');

		// 저장된 스크롤 위치가 있으면 복원 (localStorage 대신 sessionStorage 사용)
		try {
			if (typeof sessionStorage !== 'undefined') {
				const savedScrollPosition = sessionStorage.getItem('feed_scroll_position');
				if (savedScrollPosition) {
					// RAF(requestAnimationFrame)를 사용하여 DOM이 완전히 렌더링된 후 스크롤 복원
					requestAnimationFrame(() => {
						// setTimeout을 통해 컴포넌트가 완전히 마운트된 후 스크롤 복원
						setTimeout(() => {
							const scrollPos = parseInt(savedScrollPosition);
							window.scrollTo({
								top: scrollPos,
								behavior: 'auto', // smooth 대신 auto를 사용하여 즉시 이동
							});
							console.log('스크롤 위치 복원:', scrollPos);

							// 스크롤 위치 복원 후 데이터 삭제
							sessionStorage.removeItem('feed_scroll_position');
						}, 100); // 100ms의 지연 시간으로 충분한 마운트 시간 확보
					});
				}
			}
		} catch (e) {
			console.warn('스크롤 위치 복원 실패:', e);
		}
	});

	let scrollY = $state(0);
	let y = $state(0);

	function handleScroll() {
		console.log('스크롤 이벤트 발생');
		// currentScrollY = window.scrollY;

		// // 스크롤 방향 감지
		// if (currentScrollY > prevScrollY) {
		// 	// 아래로 스크롤
		// 	isNavVisible = false;
		// } else {
		// 	// 위로 스크롤
		// 	isNavVisible = true;
		// }

		// prevScrollY = currentScrollY;
	}
	let contentElement: HTMLElement;

	$effect(() => {
		if (contentElement) {
	  		setTimeout(() => {
				contentElement.scrollTo({
					top: contentElement.scrollHeight / 2,
					behavior: 'auto'
				});
				console.log('111')
			}, 1000);
			// contentElement.scrollTo
			// console.log('scrollHeight',contentElement.scrollTo)
			// contentElement.addEventListener('scroll', handleScroll);
		}
	});
</script>

<!-- 상단 고정 헤더 -->
<!-- <header class="fixed top-0 left-0 right-0 bg-white z-50 border-b border-gray-200 shadow-xs">
	<div class="max-w-lg mx-auto px-4 py-3">
		<h1 class="text-lg font-bold">피드</h1>
	</div>
</header> -->

<!-- 메인 콘텐츠 영역 - 헤더 아래에 위치하도록 패딩 적용 -->
<!-- <svelte:window onscroll={handleScroll} /> -->
<header class="fixed top-0 right-0 left-0 z-50 border-b border-gray-200 bg-white shadow-xs">
	<div class="mx-auto max-w-lg px-4 py-3">
		<div class="flex items-center justify-between">
			<h1 class="text-lg font-bold text-gray-900"> 0</h1>
		</div>
	</div>

	<!-- 탭 네비게이션 추가 -->
	<div class="border-b border-gray-200 bg-white">
	
	</div>
</header>
<div class="min-h-screen bg-gray-100 pt-0" bind:this={contentElement} onscroll={(e) => console.log(e.target)}>
	<div class="mx-auto max-w-lg px-0 py-4 sm:px-4" bind:this={contentElement} onscroll={(e) => console.log(e.target)}>
		<!-- {y} -->
		{#each posts as post}
			<FeedPost {...post} />
		{/each}
	</div>
</div>

<!-- <script context="module">
	export default {};
</script> -->
