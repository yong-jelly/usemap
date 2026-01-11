/**
 * 공통 유틸리티 함수
 */

/**
 * 문자열 또는 URL에서 네이버 공유 ID(shareId)를 추출합니다.
 */
export function extractShareId(input: string): string {
    if (!input) return '';
    
    // URL 형태인 경우 (shares/... 또는 folder/...)
    const shareMatch = input.match(/shares\/([a-zA-Z0-9]+)/);
    if (shareMatch) return shareMatch[1];

    const folderMatch = input.match(/folder\/([a-zA-Z0-9]+)/);
    if (folderMatch) return folderMatch[1];

    // 단순 문자열인 경우
    return input.trim();
}

/**
 * 배열을 지정된 크기의 청크로 나눕니다.
 */
export function chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
        chunks.push(array.slice(i, i + size));
    }
    return chunks;
}

/**
 * 일정 시간 동안 실행을 멈춥니다.
 */
export const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
