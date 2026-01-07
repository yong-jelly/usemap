import { supabase } from '$lib/supabase';
import type { Provider } from '@supabase/supabase-js';

// 개발 환경 URL
const LOCAL_URL = 'http://localhost:5173';

/**
 * Supabase 인증 서비스
 * - 소셜 로그인, 이메일 로그인, 로그아웃 등 인증 관련 기능 제공
 */
export const authService = {
  /**
   * 소셜 로그인 (구글, 페이스북, 깃허브 등)
   * @param provider 소셜 로그인 제공자
   */
  async loginWithSocial(provider: Provider) {
    console.log(`[인증 서비스] ${provider} 로그인 시도...`);
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      
      if (error) {
        console.error(`[인증 서비스] ${provider} 로그인 오류:`, error);
        throw error;
      }
      
      console.log(`[인증 서비스] ${provider} 로그인 시작, 리다이렉트 URL:`, data.url);
      return data;
    } catch (error) {
      console.error(`[인증 서비스] ${provider} 로그인 예외 발생:`, error);
      throw error;
    }
  },

  /**
   * 이메일/비밀번호 로그인
   * @param email 사용자 이메일
   * @param password 사용자 비밀번호
   */
  async loginWithEmail(email: string, password: string) {
    console.log(`[인증 서비스] 이메일 로그인 시도: ${email}`);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        console.error('[인증 서비스] 이메일 로그인 오류:', error);
        throw error;
      }
      
      console.log('[인증 서비스] 이메일 로그인 성공:', data.user?.email);
      return data;
    } catch (error) {
      console.error('[인증 서비스] 이메일 로그인 예외 발생:', error);
      throw error;
    }
  },
  
  /**
   * 이메일/비밀번호 회원가입
   * @param email 사용자 이메일
   * @param password 사용자 비밀번호
   * @param metadata 추가 사용자 정보
   */
  async signupWithEmail(email: string, password: string, metadata = {}) {
    console.log(`[인증 서비스] 이메일 회원가입 시도: ${email}`);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: metadata,
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      
      if (error) {
        console.error('[인증 서비스] 회원가입 오류:', error);
        throw error;
      }
      
      console.log('[인증 서비스] 회원가입 성공:', data);
      return data;
    } catch (error) {
      console.error('[인증 서비스] 회원가입 예외 발생:', error);
      throw error;
    }
  },
  
  /**
   * 비밀번호 재설정 이메일 전송
   * @param email 사용자 이메일
   */
  async resetPassword(email: string) {
    console.log(`[인증 서비스] 비밀번호 재설정 요청: ${email}`);
    try {
      const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });
      
      if (error) {
        console.error('[인증 서비스] 비밀번호 재설정 이메일 전송 오류:', error);
        throw error;
      }
      
      console.log('[인증 서비스] 비밀번호 재설정 이메일 전송 성공');
      return data;
    } catch (error) {
      console.error('[인증 서비스] 비밀번호 재설정 요청 예외 발생:', error);
      throw error;
    }
  },
  
  /**
   * 로그아웃
   */
  async logout() {
    console.log('[인증 서비스] 로그아웃 시도...');
    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('[인증 서비스] 로그아웃 오류:', error);
        throw error;
      }
      
      console.log('[인증 서비스] 로그아웃 성공');
    } catch (error) {
      console.error('[인증 서비스] 로그아웃 예외 발생:', error);
      throw error;
    }
  },
  
  /**
   * 현재 로그인한 사용자 정보 가져오기
   */
  async getCurrentUser() {
    console.log('[인증 서비스] 현재 사용자 정보 요청...');
    try {
      const { data, error } = await supabase.auth.getUser();
      
      if (error) {
        console.error('[인증 서비스] 사용자 정보 가져오기 오류:', error);
        throw error;
      }
      
      console.log('[인증 서비스] 현재 사용자 정보 로드 성공:', data.user?.email);
      return data.user;
    } catch (error) {
      console.error('[인증 서비스] 사용자 정보 가져오기 예외 발생:', error);
      throw error;
    }
  },
  
  /**
   * 현재 세션 정보 가져오기
   */
  async getSession() {
    console.log('[인증 서비스] 세션 정보 요청...');
    try {
      const { data, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('[인증 서비스] 세션 정보 가져오기 오류:', error);
        throw error;
      }
      
      console.log('[인증 서비스] 세션 정보 로드 성공:', data.session?.user.email);
      return data.session;
    } catch (error) {
      console.error('[인증 서비스] 세션 정보 가져오기 예외 발생:', error);
      throw error;
    }
  },
  
  /**
   * 사용자 프로필 업데이트
   * @param userData 업데이트할 사용자 데이터
   */
  async updateProfile(userData: any) {
    console.log('[인증 서비스] 프로필 업데이트 시도...', userData);
    try {
      const { data, error } = await supabase.auth.updateUser({
        data: userData
      });
      
      if (error) {
        console.error('[인증 서비스] 프로필 업데이트 오류:', error);
        throw error;
      }
      
      console.log('[인증 서비스] 프로필 업데이트 성공:', data.user);
      return data.user;
    } catch (error) {
      console.error('[인증 서비스] 프로필 업데이트 예외 발생:', error);
      throw error;
    }
  }
}; 