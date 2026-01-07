import type { HotelInfo } from './types';

export function createPriceMarker(hotel: HotelInfo): string {
	return `
    <div class="cursor-pointer">
      <div class="px-3 py-1 bg-blue-600 text-white text-sm font-bold rounded-full shadow-lg hover:bg-blue-700 transition-colors">
        $${hotel.price}
      </div>
    </div>
  `;
}

export function createInfoMarker(hotel: HotelInfo): string {
	return `
    <div class="bg-white rounded-lg p-2 shadow-lg relative cursor-pointer w-40">
      <div class="flex justify-between items-start">
        <span class="font-bold text-gray-800">${hotel.type}</span>
        <span class="bg-blue-600 text-white text-xs font-bold px-2 py-0.5 rounded">${hotel.rating}</span>
      </div>
      <div class="text-xl font-extrabold text-gray-900 mt-1">$${hotel.price}</div>
      <div class="text-xs text-gray-500">${hotel.nights} night${hotel.nights > 1 ? 's' : ''} ${hotel.guests} guest${
				hotel.guests > 1 ? 's' : ''
			}</div>
      <div style="clip-path: polygon(50% 100%, 0 0, 100% 0);" class="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-4 h-2 bg-white shadow-md"></div>
    </div>
  `;
}

export function createSelectedInfoMarker(hotel: HotelInfo): string {
	const imageHtml = hotel.imageUrl
		? `
    <div class="relative group">
      <img src="${hotel.imageUrl}" alt="${hotel.name}" class="w-full h-32 object-cover rounded-t-lg">
      <div class="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity flex justify-between items-center">
        <button class="text-white bg-black/40 p-1 rounded-full ml-2 hover:bg-black/60">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>
        </button>
        <button class="text-white bg-black/40 p-1 rounded-full mr-2 hover:bg-black/60">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>
        </button>
      </div>
    </div>`
		: '';

	return `
    <div class="bg-white rounded-lg shadow-xl relative w-60 cursor-pointer">
      ${imageHtml}
      <div class="p-3">
        <div class="flex justify-between items-start">
          <span class="font-bold text-gray-800 text-lg">${hotel.type}</span>
          <span class="bg-blue-600 text-white text-sm font-bold px-2 py-1 rounded">${hotel.rating}</span>
        </div>
        <div class="text-2xl font-extrabold text-gray-900 mt-1">$${hotel.price}</div>
        <div class="text-sm text-gray-500">${hotel.nights} night${hotel.nights > 1 ? 's' : ''} ${hotel.guests} guest${
					hotel.guests > 1 ? 's' : ''
				}</div>
      </div>
      <div style="clip-path: polygon(50% 100%, 0 0, 100% 0);" class="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-4 h-2 bg-white"></div>
    </div>
  `;
}
