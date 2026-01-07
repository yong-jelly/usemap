<script lang="ts">
	import type { RouteConfig, RouteResult } from '@mateothegreat/svelte5-router';
	import {
		Router,
		StatusCode,
		getStatusByValue,
		type RouterInstance,
	} from '@mateothegreat/svelte5-router';

	// 하위 컴포넌트 import
	import FeatureIndex from './feature/Index.svelte';
	import PlaceIndex from './place/Index.svelte';
	import UserIndex from './user/Index.svelte';
	import NotFound from '../NotFound.svelte';

	let router: RouterInstance | undefined = $state();

	const routes: RouteConfig[] = [
		{
			path: '/sub-stat/feature/latest',
			component: FeatureIndex,
		},
		{
			path: '/sub-stat/place/(?<id>[^/]+)',
			component: PlaceIndex,
		},
		{
			// path: '/sub-stat/user/(?<id>[^/]+)',
			path: '/sub-stat/user/me',
			component: UserIndex,
		},
	];
</script>

<div class="flex-1 overflow-auto bg-gray-50 dark:bg-neutral-900">
	<div class="mx-auto max-w-lg">
		<Router
			bind:instance={router}
			{routes}
			statuses={{
				[StatusCode.NotFound]: (route: RouteResult) => {
					console.warn(`Sub-stat route "${route.result.path.original}" could not be found`);
					return {
						component: NotFound,
						props: {
							message: '요청하신 통계 페이지를 찾을 수 없습니다.',
						},
					};
				},
			}}
		/>
	</div>
</div>
