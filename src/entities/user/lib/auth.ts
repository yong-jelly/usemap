import { UserProfile } from "../types";

/**
 * 사용자가 관리자인지 확인합니다.
 * @param profile 사용자 프로필 객체
 * @returns 관리자 여부
 */
export const isAdmin = (profile: UserProfile | null | undefined): boolean => {
  if (!profile || !profile.role) return false;
  return profile.role.toLowerCase() === 'admin';
};
