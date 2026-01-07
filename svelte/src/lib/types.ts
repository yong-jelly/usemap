// Supabase Edge Function 모델 정의 (geocode 등)

/**
 * geocode function input (좌표 기반 주소 변환)
 * @property coords - '경도,위도' 문자열 (예: '127.123,37.456')
 */
export interface LocationGeocodeInput {
  coords: string; // '경도,위도' 문자열
}

/**
 * geocode function output result
 * @property name - 코드 종류(admcode, legalcode 등)
 * @property code - 코드 정보
 * @property region - 지역 정보(행정동, 법정동 등)
 */
export interface LocationGeocodeResult {
  name: string;
  code: {
    id: string;
    type: string;
    mappingId: string;
  };
  region: {
    area0: { name: string; coords: { center: { crs: string; x: number; y: number } } };
    area1: { name: string; coords: { center: { crs: string; x: number; y: number } }; alias?: string };
    area2: { name: string; coords: { center: { crs: string; x: number; y: number } } };
    area3: { name: string; coords: { center: { crs: string; x: number; y: number } } };
    area4: { name: string; coords: { center: { crs: string; x: number; y: number } } };
  };
} 