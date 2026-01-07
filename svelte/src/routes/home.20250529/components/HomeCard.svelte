<script lang="ts">
    
    interface Props {
        // 홈 카드 컴포넌트 프롭스
        title: string;
        description: string;
        hasImage?: boolean;
        imageIndex?: number;
    }

    let {
        title,
        description,
        hasImage = false,
        imageIndex = 1
    }: Props = $props();
</script>

<div class="bg-white p-4 rounded-lg shadow hover:shadow-md transition-shadow">
    <h2 class="font-bold text-lg">{title}</h2>
    <p class="text-gray-700 mt-2">{description}</p>
    <p class="text-gray-500 text-sm mt-1">맛집 정보와 리뷰를 확인해보세요.</p>
    
    {#if hasImage}
        <div class="h-40 bg-gray-100 mt-4 flex items-center justify-center overflow-hidden rounded">
            <div class="text-gray-400 text-sm absolute">이미지 영역 ({imageIndex})</div>
            <img 
                src={`https://source.unsplash.com/random/400x300?food&sig=${imageIndex}`} 
                alt="장소 이미지"
                class="w-full h-full object-cover"
                loading="lazy"
            />
        </div>
    {/if}
    
    <div class="flex mt-4 justify-between items-center">
        <div class="flex space-x-2">
            <span class="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">맛집</span>
            <span class="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">서울</span>
        </div>
        
        <button class="text-sm text-blue-600 hover:text-blue-800">
            자세히 보기
        </button>
    </div>
</div> 