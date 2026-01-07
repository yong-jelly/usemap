
/**
 * 두 시간 사이의 경과 시간을 '~전' 형식으로 반환합니다.
 * @param targetTime 비교할 시간 (ISO 문자열 또는 Date 객체)
 * @param currentTime 현재 시간 (ISO 문자열 또는 Date 객체, 기본값은 현재 시간)
 * @returns 경과 시간을 나타내는 문자열 (예: '3일 전', '5시간 전', '10분 전')
 */
export function getTimeAgo(targetTime: string | Date, currentTime: string | Date = new Date()): string {
  const targetDate = typeof targetTime === 'string' ? new Date(targetTime) : targetTime;
  const currentDate = typeof currentTime === 'string' ? new Date(currentTime) : currentTime;
  
  const diffMs = currentDate.getTime() - targetDate.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);
  const diffMonth = Math.floor(diffDay / 30);
  const diffYear = Math.floor(diffDay / 365);
  
  if (diffYear > 0) {
    return `${diffYear}년 전`;
  } else if (diffMonth > 0) {
    return `${diffMonth}개월 전`;
  } else if (diffDay > 0) {
    return `${diffDay}일 전`;
  } else if (diffHour > 0) {
    return `${diffHour}시간 전`;
  } else if (diffMin > 0) {
    return `${diffMin}분 전`;
  } else {
    return '방금 전';
  }
}
