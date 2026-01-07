<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import * as Sheet from '$lib/components/ui/sheet';
	import { saveToListStore } from '$lib/stores/save-to-list.store';
	import Icon from '$lib/components/Icon.svelte';
	import { Input } from '$lib/components/ui/input';
	import * as RadioGroup from '$lib/components/ui/radio-group';
	import { Label } from '$lib/components/ui/label';
	import { Switch } from '$lib/components/ui/switch';
	import { cn } from '$lib/utils';
	import { get } from 'svelte/store';

	let view = $state<'lists' | 'newList'>('lists');
	let listName = $state('');
	let listMemo = $state('');
	let listUrl = $state('');

	let isOpen = $state(get(saveToListStore).isOpen);
	let place = $state(get(saveToListStore).place);

	$effect(() => {
		const unsubscribe = saveToListStore.subscribe((value) => {
			isOpen = value.isOpen;
			place = value.place;
		});
		return unsubscribe;
	});

	$effect(() => {
		// sync local state back to store
		if (!isOpen && get(saveToListStore).isOpen) {
			saveToListStore.close();
		}
	});

	const lists = [
		{ id: '1', name: '내 장소', count: 171, isPublic: false, icon: 'star' },
		{ id: '2', name: '드라이브', count: 116, isPublic: true, icon: 'car' },
		{ id: '3', name: '맛집', count: 170, isPublic: true, icon: 'utensils' },
		{ id: '4', name: '제주도 2025/04월', count: 12, isPublic: true, icon: 'plane' },
		{ id: '5', name: '쉬자', count: 12, isPublic: true, icon: 'coffee' },
		{ id: '6', name: '클리앙', count: 8, isPublic: true, icon: 'leaf' },
		{ id: '7', name: '제주도', count: 73, isPublic: true, icon: 'plane' }
	];

	const colors = [
		'#ff453a',
		'#ff9f0a',
		'#ffd60a',
		'#30d158',
		'#64d2ff',
		'#0a84ff',
		'#bf5af2',
		'#ff375f',
		'#a2845e',
		'#63869a',
		'#3d3d3d',
		'#8e8e93'
	];
	let selectedColor = $state(colors[0]);

	$effect(() => {
		if (!isOpen) {
			// Reset state when sheet closes
			view = 'lists';
			listName = '';
			listMemo = '';
			listUrl = '';
			selectedColor = colors[0];
		}
	});
</script>

<Sheet.Root bind:open={isOpen}>
	<Sheet.Content
		side="bottom"
		class="mx-auto max-h-dvh max-w-2xl rounded-t-lg p-0"
		onPointerDownOutside={(e: CustomEvent) => {
			const target = e.target;
			if (target instanceof Element && target.closest('[cmdk-root]')) {
				e.preventDefault();
			}
		}}
	>
		{#if view === 'lists'}
			<div class="flex h-12 items-center justify-between border-b px-4">
				<div class="flex items-center space-x-2">
					<Icon name="folder-plus" class="h-5 w-5" />
					<h2 class="text-lg font-semibold">{place?.name}</h2>
				</div>
				<Sheet.Close class="-mr-2 rounded-full p-2 hover:bg-gray-100">
					<Icon name="x" class="h-6 w-6" />
				</Sheet.Close>
			</div>
			<div class="max-h-[calc(100dvh-12rem)] overflow-y-auto p-4">
				<button
					class="flex w-full items-center space-x-3 rounded-lg p-3 text-left hover:bg-gray-100"
					onclick={() => (view = 'newList')}
				>
					<div
						class="flex h-8 w-8 items-center justify-center rounded-full border-2 border-dashed border-gray-400"
					>
						<Icon name="plus" class="h-5 w-5 text-gray-500" />
					</div>
					<span class="text-base font-medium">새 리스트 만들기</span>
				</button>
				<ul class="mt-2">
					{#each lists as list}
						<li
							class="flex cursor-pointer items-center justify-between rounded-lg p-3 hover:bg-gray-100"
						>
							<div class="flex items-center space-x-3">
								<div class="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500">
									<Icon name={list.icon} class="h-5 w-5 text-white" />
								</div>
								<span class="font-medium">{list.name}</span>
								<span class="text-sm text-gray-500">{list.count}</span>
							</div>
							<div class="flex h-6 w-6 items-center justify-center rounded-full border">
								<!-- check icon here -->
							</div>
						</li>
					{/each}
				</ul>
			</div>
			<div class="border-t p-4">
				<Button class="w-full" size="lg">저장</Button>
			</div>
		{:else if view === 'newList'}
			<div class="flex h-12 items-center justify-center border-b px-4">
				<button
					class="absolute left-2 rounded-full p-2 hover:bg-gray-100"
					onclick={() => (view = 'lists')}
				>
					<Icon name="chevron-down" class="h-6 w-6" />
				</button>
				<h2 class="text-lg font-semibold">새 리스트 추가</h2>
			</div>

			<div class="max-h-[calc(100dvh-12rem)] overflow-y-auto p-4">
				<div class="relative">
					<Input bind:value={listName} placeholder="새 리스트명을 입력해주세요." maxlength="20" />
					<span class="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">
						{listName.length}/20
					</span>
				</div>

				<div class="mt-6">
					<h3 class="text-base font-semibold">색상 선택</h3>
					<div class="mt-3 grid grid-cols-6 gap-3">
						{#each colors as color}
							<button
								class={cn('h-10 w-10 rounded-full border-2 transition', {
									'border-blue-500': selectedColor === color
								})}
								style="background-color: {color};"
								onclick={() => (selectedColor = color)}
							>
								{#if selectedColor === color}
									<Icon name="check" class="h-6 w-6 text-white" />
								{/if}
							</button>
						{/each}
					</div>
				</div>

				<div class="mt-6 border-t pt-6">
					<h3 class="text-base font-semibold">공개 범위</h3>
					<RadioGroup.Root class="mt-3 space-y-3" value="private">
						<div class="flex items-center">
							<RadioGroup.Item value="public" id="public" />
							<Label for="public" class="ml-3 flex flex-col">
								<span class="font-medium">공개</span>
								<span class="text-sm text-gray-500"
									>URL로 다른 사람에게 리스트를 공유할 수 있습니다.</span
								>
							</Label>
						</div>
						<div class="flex items-center">
							<RadioGroup.Item value="private" id="private" />
							<Label for="private" class="ml-3 flex flex-col">
								<span class="font-medium">비공개</span>
								<span class="text-sm text-gray-500"
									>나만 볼 수 있으며, 다른 사람과 공유할 수 없습니다.</span
								>
							</Label>
						</div>
					</RadioGroup.Root>
				</div>

				<div class="mt-6 flex items-center justify-between border-t pt-6">
					<div>
						<h3 class="font-semibold">내 리스트 노출 허용</h3>
						<p class="text-sm text-gray-500">
							공개 리스트 목록 및 네이버 서비스에서 이 리스트와 정보(장소 수, 조회 수, 저장
							수)가 노출되는 것을 허용합니다.
						</p>
					</div>
					<Switch />
				</div>

				<div class="mt-6 border-t pt-6">
					<h3 class="text-base font-semibold">상세 설정 선택</h3>
					<div class="mt-3 space-y-3">
						<div class="relative">
							<Input bind:value={listMemo} placeholder="메모를 남겨주세요." maxlength="30" />
							<span class="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">
								{listMemo.length}/30
							</span>
						</div>
						<Input bind:value={listUrl} placeholder="관련 URL을 추가해주세요." />
					</div>
				</div>
			</div>

			<div class="border-t p-4">
				<Button class="w-full" size="lg" disabled={!listName}>완료</Button>
			</div>
		{/if}
	</Sheet.Content>
</Sheet.Root> 