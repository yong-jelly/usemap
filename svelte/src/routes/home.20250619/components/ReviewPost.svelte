<script lang="ts">
import { Heart, MessageCircle, Share, Bookmark, Star, MapPin, Clock } from 'lucide-svelte';
import type { Place } from '$services/types';

interface ReviewPost {
  id: string;
  user: {
    id: string;
    name: string;
    username: string;
    avatar: string;
    verified?: boolean;
  };
  place: {
    id: string;
    name: string;
    address: string;
    category: string;
  };
  content: string;
  rating: number;
  images: string[];
  createdAt: string;
  likes: number;
  comments: number;
  shares: number;
  isLiked: boolean;
  isBookmarked: boolean;
}

const { post } = $props<{ post: ReviewPost }>();

let isLiked = $state(post.isLiked);
let isBookmarked = $state(post.isBookmarked);
let likesCount = $state(post.likes);

function toggleLike() {
  isLiked = !isLiked;
  likesCount += isLiked ? 1 : -1;
}

function toggleBookmark() {
  isBookmarked = !isBookmarked;
}

function formatTimeAgo(dateString: string) {
  const now = new Date();
  const date = new Date(dateString);
  const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
  
  if (diffInMinutes < 1) return '방금 전';
  if (diffInMinutes < 60) return `${diffInMinutes}분 전`;
  if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}시간 전`;
  return `${Math.floor(diffInMinutes / 1440)}일 전`;
}

// 이미지 오류 처리
function handleImageError(event: Event) {
  const imgElement = event.target as HTMLImageElement;
  if (imgElement && imgElement.src) {
    imgElement.src = 'https://placehold.co/600x400?text=ERROR';
  }
}
</script>

<article class="bg-white rounded-lg shadow-xs mb-1 overflow-hidden">
  <!-- 헤더 -->
  <header class="flex items-center justify-between p-4 pb-3">
    <div class="flex items-center gap-3">
      <img 
        src={post.user.avatar} 
        alt={post.user.name}
        class="w-10 h-10 rounded-full object-cover"
      />
      <div class="flex-1">
        <div class="flex items-center gap-1">
          <h3 class="font-semibold text-gray-900 text-sm">{post.user.name}</h3>
          {#if post.user.verified}
            <svg class="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
            </svg>
          {/if}
        </div>
        <p class="text-xs text-gray-500">@{post.user.username}</p>
      </div>
    </div>
    <div class="flex items-center gap-2 text-xs text-gray-500">
      <Clock class="w-3 h-3" />
      <span>{formatTimeAgo(post.createdAt)}</span>
    </div>
  </header>

  <!-- 장소 정보 -->
  <div class="px-4 pb-3">
    <div class="flex items-center gap-2 p-3 bg-gray-50 rounded-lg border">
      <MapPin class="w-4 h-4 text-gray-600" />
      <div class="flex-1">
        <h4 class="font-medium text-gray-900 text-sm">{post.place.name}</h4>
        <p class="text-xs text-gray-500">{post.place.address} • {post.place.category}</p>
      </div>
      <div class="flex items-center gap-1">
        {#each Array(5) as _, i}
          <Star class={`w-3 h-3 ${i < post.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} />
        {/each}
      </div>
    </div>
  </div>

  <!-- 리뷰 내용 -->
  <div class="px-4 pb-3">
    <p class="text-gray-900 text-sm leading-relaxed whitespace-pre-wrap">{post.content}</p>
  </div>

  <!-- 이미지 - PlaceCard.svelte 스타일 적용 -->
  {#if post.images.length > 0}
    {#if post.images.length === 1}
      <div class="w-full h-80 relative">
        <img 
          src={post.images[0]} 
          alt="리뷰 이미지"
          class="w-full h-full object-cover"
          onerror={handleImageError}
          loading="lazy"
        />
      </div>
    {:else if post.images.length === 2}
      <div class="w-full h-80 grid grid-cols-2 gap-1">
        {#each post.images as image}
          <img 
            src={image} 
            alt="리뷰 이미지"
            class="w-full h-full object-cover"
            onerror={handleImageError}
            loading="lazy"
          />
        {/each}
      </div>
    {:else if post.images.length >= 3}
      <div class="w-full h-60 grid grid-cols-2 gap-1">
        <img 
          src={post.images[0]} 
          alt="리뷰 이미지"
          class="w-full h-60 object-cover"
          onerror={handleImageError}
          loading="lazy"
        />
        <div class="grid grid-rows-2 gap-1 h-60">
          <img 
            src={post.images[1]} 
            alt="리뷰 이미지"
            class="w-full h-full object-cover"
            onerror={handleImageError}
            loading="lazy"
          />
          <div class="relative">
            <img 
              src={post.images[2]} 
              alt="리뷰 이미지"
              class="w-full h-full object-cover"
              onerror={handleImageError}
              loading="lazy"
            />
            {#if post.images.length > 3}
              <div class="absolute inset-0 bg-black/60 rounded-lg flex items-center justify-center">
                <span class="text-white font-semibold text-sm">+{post.images.length - 3}</span>
              </div>
            {/if}
          </div>
        </div>
      </div>
    {/if}
  {/if}

  <!-- 액션 버튼 -->
  <footer class="px-4 py-3 border-t border-gray-100">
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-6">
        <button 
          class="flex items-center gap-2 text-gray-500 hover:text-red-500 transition-colors"
          onclick={toggleLike}
        >
          <Heart class={`w-4 h-4 ${isLiked ? 'text-red-500 fill-red-500' : ''}`} />
          <span class="text-sm font-medium">{likesCount}</span>
        </button>
        
        <button class="flex items-center gap-2 text-gray-500 hover:text-blue-500 transition-colors">
          <MessageCircle class="w-4 h-4" />
          <span class="text-sm font-medium">{post.comments}</span>
        </button>
        
        <button class="flex items-center gap-2 text-gray-500 hover:text-green-500 transition-colors">
          <Share class="w-4 h-4" />
          <span class="text-sm font-medium">{post.shares}</span>
        </button>
      </div>
      
      <button 
        class="text-gray-500 hover:text-yellow-500 transition-colors"
        onclick={toggleBookmark}
      >
        <Bookmark class={`w-4 h-4 ${isBookmarked ? 'text-yellow-500 fill-yellow-500' : ''}`} />
      </button>
    </div>
  </footer>
</article> 