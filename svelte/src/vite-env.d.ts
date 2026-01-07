/// <reference types="svelte" />
/// <reference types="vite/client" />

// Google Analytics 타입 정의
declare global {
	interface Window {
		gtag: (...args: any[]) => void;
		dataLayer: any[];
	}
}

// Google Analytics gtag 타입 정의
declare global {
	interface Window {
		gtag: (
			command: 'config' | 'set' | 'event',
			targetId: string,
			config?: any
		) => void;
		dataLayer: any[];
	}
}

export {};
