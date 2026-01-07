import { supabase } from '$lib/supabase';
import type { User } from '@supabase/supabase-js';
import { writable } from 'svelte/store';
import { profileService } from './profile.service';
import type { UserProfile } from './types';

// 사용자 인터페이스
export interface UserInfo {
	id: string | null;
	email: string | null;
	name: string | null;
	avatar_url: string | null;
	isAuthenticated: boolean;
	metadata: any;
	profile: UserProfile | null;
}

// 초기 상태
const initialUser: UserInfo = {
	id: null,
	email: null,
	name: null,
	avatar_url: null,
	isAuthenticated: false,
	metadata: {},
	profile: null,
};

function createAuthStore() {
	const { subscribe, set, update } = writable<UserInfo>(initialUser);

	// 초기 사용자 정보 로드 및 인증 상태 변경 감지
	supabase.auth.getSession().then(({ data: { session } }) => {
		if (session) {
			updateUserInfo(session.user);
		} else {
			set(initialUser); // 로그아웃 상태
		}
	});

	supabase.auth.onAuthStateChange((_event, session) => {
		if (session) {
			updateUserInfo(session.user);
		} else {
			set(initialUser); // 로그아웃 상태
		}
	});

	// 사용자 정보 업데이트 함수
	async function updateUserInfo(user: User) {
		// 프로필 정보 가져오기 (예시)
		const profile = await profileService.getCurrentUserProfile();

		set({
			id: user.id,
			email: user.email ?? null,
			// 프로필 또는 메타데이터에서 이름/아바타 가져오기
			name: profile?.nickname ?? user.user_metadata?.full_name ?? user.user_metadata?.name ?? null,
			avatar_url:
				profile?.profile_image_url ??
				user.user_metadata?.avatar_url ??
				user.user_metadata?.picture ??
				null,
			isAuthenticated: true,
			metadata: user.user_metadata ?? {},
			profile: profile,
		});
	}

	// 로그인 함수 (구글 로그인 예시)
	async function login() {
		const { error } = await supabase.auth.signInWithOAuth({
			provider: 'google',
			// options: { redirectTo: window.location.origin } // 필요시 리디렉션 URL 설정
		});
		if (error) {
			console.error('Google login error:', error);
			// TODO: 사용자에게 오류 알림
		}
	}

	// 로그아웃 함수
	async function logout() {
		const { error } = await supabase.auth.signOut();
		if (error) {
			console.error('Logout error:', error);
		} else {
			set(initialUser); // 상태 초기화
		}
	}

	return {
		subscribe,
		login, // 로그인 함수 노출
		logout, // 로그아웃 함수 노출
		// user: derived(store, $store => $store) // 읽기 전용 user 상태가 필요하다면 derived 사용 가능
	};
}

export const authStore = createAuthStore();