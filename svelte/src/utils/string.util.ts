/**
 * 문자열이 지정된 길이를 초과할 경우 말줄임표(...)를 추가합니다
 * @param text - 원본 문자열
 * @param maxLength - 최대 길이
 * @param ellipsis - 말줄임 문자 (기본값: '...')
 * @returns 처리된 문자열
 */
export function truncate(text: string, maxLength: number, ellipsis: string = '...'): string {
  if (!text) return '';
  
  if (text.length <= maxLength) {
    return text;
  }
  
  return text.slice(0, maxLength) + ellipsis;
}
