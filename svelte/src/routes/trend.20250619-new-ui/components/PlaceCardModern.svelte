<script lang="ts">
	import { Heart, Star, Bookmark } from 'lucide-svelte';

	const {
		name,
		category,
		imageUrl,
		tags = [],
		region,
		onClick = () => {}
	} = $props<{
		name: string;
		category: string;
		imageUrl: string;
		tags?: string[];
		region: string;
		onClick?: (e: Event) => void;
	}>();

	let isLiked = $state(false);
	let isSaved = $state(false);

	function toggleLike(e: Event) {
		e.stopPropagation();
		isLiked = !isLiked;
	}
	function toggleSave(e: Event) {
		e.stopPropagation();
		isSaved = !isSaved;
	}
</script>

<div
	class="group relative rounded-lg overflow-hidden shadow-sm bg-white border border-gray-100 transition-all hover:shadow-md cursor-pointer min-w-[160px] flex flex-col"
	onclick={onClick}
>
	<div class="relative">
		<img
			src={imageUrl || 'https://placehold.co/400x400?text=NO+IMAGE'}
			alt={name}
			class="w-full h-32 object-cover bg-gray-50 transition-all group-hover:brightness-95"
			loading="lazy"
		/>
		<div class="absolute top-2 right-2 flex gap-1 z-10">
			<button
				class="p-1.5 rounded-full bg-white/90 hover:bg-white transition-colors shadow-sm"
				aria-label="좋아요"
				onclick={toggleLike}
			>
				<Heart class={`w-3.5 h-3.5 ${isLiked ? 'text-red-500 fill-red-500' : 'text-gray-600'}`} />
			</button>
			<button
				class="p-1.5 rounded-full bg-white/90 hover:bg-white transition-colors shadow-sm"
				aria-label="저장"
				onclick={toggleSave}
			>
				<Bookmark
					class={`w-3.5 h-3.5 ${isSaved ? 'text-blue-500 fill-blue-500' : 'text-gray-600'}`}
				/>
			</button>
		</div>
	</div>

	<div class="flex-1 flex flex-col p-3 gap-1">
		<div class="text-sm font-semibold text-gray-900 truncate">{name}</div>
		<div class="text-xs text-gray-500 truncate">{region}</div>
		<div class="text-xs text-gray-400 mt-1">{category}</div>
		<div class="flex flex-wrap gap-1 mt-2">
			{#each tags as tag}
				<span
					class="px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 text-[10px] font-medium border border-blue-100"
					>#{tag}</span
				>
			{/each}
		</div>
	</div>
</div> 