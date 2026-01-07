/**
 * Google Analytics 이벤트 추적 유틸리티
 */

// Google Analytics ID
const GA_MEASUREMENT_ID = 'G-X6K360K3QR';

/**
 * Google 태그가 로드되었는지 확인
 */
export function isGtagLoaded(): boolean {
	return typeof window !== 'undefined' && 
	       window.gtag && 
	       typeof window.gtag === 'function';
}

/**
 * 페이지뷰 이벤트 전송
 */
export function trackPageView(pagePath: string, pageTitle?: string) {
	if (!isGtagLoaded()) {
		return;
	}

	window.gtag('config', GA_MEASUREMENT_ID, {
		page_path: pagePath,
		page_title: pageTitle || document.title
	});
}

/**
 * 커스텀 이벤트 전송
 */
export function trackEvent(eventName: string, parameters?: Record<string, any>) {
	if (!isGtagLoaded()) {
		return;
	}

	window.gtag('event', eventName, {
		...parameters,
		app_name: 'private_place_ui',
		timestamp: new Date().toISOString()
	});
}

/**
 * 장소 관련 이벤트 추적
 */
export function trackPlaceEvent(action: 'view' | 'like' | 'review' | 'share', placeId: string, placeName?: string) {
	trackEvent('place_interaction', {
		action,
		place_id: placeId,
		place_name: placeName
	});
}

/**
 * 사용자 인터랙션 이벤트 추적
 */
export function trackUserInteraction(action: 'login' | 'signup' | 'logout' | 'profile_edit', details?: Record<string, any>) {
	trackEvent('user_interaction', {
		action,
		...details
	});
}

/**
 * 네비게이션 이벤트 추적
 */
export function trackNavigation(fromPage: string, toPage: string, method: 'click' | 'back' | 'forward' = 'click') {
	trackEvent('navigation', {
		from_page: fromPage,
		to_page: toPage,
		method
	});
}

/**
 * 검색 이벤트 추적
 */
export function trackSearch(searchTerm: string, resultCount?: number, category?: string) {
	trackEvent('search', {
		search_term: searchTerm,
		result_count: resultCount,
		category
	});
} 