// // src/lib/stores/interactions.js
// import { writable } from 'svelte/store';

// export const likedItems = writable(new Set());
// export const bookmarkedItems = writable(new Set());

// // 좋아요/북마크 상태 확인 함수
// export const isLiked = (itemId) => {
//   let liked = false;
//   likedItems.subscribe(items => {
//     liked = items.has(itemId);
//   })();
//   return liked;
// };

// export const isBookmarked = (itemId) => {
//   let bookmarked = false;
//   bookmarkedItems.subscribe(items => {
//     bookmarked = items.has(itemId);
//   })();
//   return bookmarked;
// };
