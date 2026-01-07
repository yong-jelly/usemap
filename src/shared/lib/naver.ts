/**
 * 원본 이미지 URL을 네이버 이미지 리사이징 URL 형식으로 변환합니다.
 * 'w' 타입을 사용하여 너비 기준으로 리사이징하며 선명도를 높입니다.
 */
export function convertToNaverResizeImageUrl(
  originalUrl: string,
  width: number = 560
): string {
  const encodedUrl = encodeURIComponent(originalUrl);
  const resizeBaseUrl = `https://search.pstatic.net/common/?autoRotate=true&type=w${width}_sharpen&src=`;
  return `${resizeBaseUrl}${encodedUrl}`;
}

/**
 * 원본 이미지 URL을 네이버 이미지 리사이징 URL 형식으로 변환합니다 (품질 포함).
 * 'f' 타입을 사용하여 정사각 형태로 리사이징하고 압축 품질을 지정합니다.
 */
export function convertToNaverResizeImageUrlWithQuality(
  originalUrl: string,
  width: number = 320,
  quality: number = 95
): string {
  const encodedUrl = encodeURIComponent(originalUrl);
  const resizeBaseUrl = `https://search.pstatic.net/common/?autoRotate=true&quality=${quality}&type=f${width}_${width}&src=`;
  return `${resizeBaseUrl}${encodedUrl}`;
}

/**
 * 원본 이미지 URL을 리사이징 없이 네이버 이미지 서버를 통해 프록시하여 제공합니다.
 */
export function convertToNaverUrl(
  originalUrl: string
): string {
  const encodedUrl = encodeURIComponent(originalUrl);
  const resizeBaseUrl = `https://search.pstatic.net/common/?src=`;
  return `${resizeBaseUrl}${encodedUrl}`;
}
