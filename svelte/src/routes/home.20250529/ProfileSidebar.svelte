<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  
  const dispatch = createEventDispatcher();
  
  function handleClose() {
    dispatch('close');
  }
</script>

<div class="h-full flex flex-col">
  <div class="p-4 border-b border-gray-200 flex justify-between items-center">
    <h2 class="text-xl font-bold">프로필</h2>
    <button 
      class="p-2 rounded-full hover:bg-gray-100 transition-colors duration-200" 
      onclick={handleClose}
    >
      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
      </svg>
    </button>
  </div>
  
  <div class="p-4 border-b border-gray-200">
    <div class="flex items-center space-x-3">
      <div class="w-16 h-16 rounded-full bg-gray-300 overflow-hidden">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <div>
        <h3 class="font-bold text-lg">유저 이름</h3>
        <p class="text-gray-500">@username</p>
      </div>
    </div>
    
    <div class="flex mt-4 space-x-6">
      <div>
        <span class="font-bold">42</span>
        <span class="text-gray-500">팔로잉</span>
      </div>
      <div>
        <span class="font-bold">128</span>
        <span class="text-gray-500">팔로워</span>
      </div>
    </div>
  </div>
  
  <nav class="p-2 flex-grow">
    <ul class="space-y-1">
      <li>
        <a href="#" class="block px-4 py-2 rounded-full hover:bg-gray-100 font-medium">프로필</a>
      </li>
      <li>
        <a href="#" class="block px-4 py-2 rounded-full hover:bg-gray-100 font-medium">저장됨</a>
      </li>
      <li>
        <a href="#" class="block px-4 py-2 rounded-full hover:bg-gray-100 font-medium">내 활동</a>
      </li>
      <li>
        <a href="#" class="block px-4 py-2 rounded-full hover:bg-gray-100 font-medium">설정</a>
      </li>
    </ul>
  </nav>
  
  <div class="p-4 border-t border-gray-200">
    <button class="w-full py-2 bg-red-500 text-white rounded-full font-medium hover:bg-red-600 transition-colors duration-200">
      로그아웃
    </button>
  </div>
</div> 