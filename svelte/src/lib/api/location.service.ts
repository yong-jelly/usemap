import { callSupabaseFunction } from './supabase-function';
import type { LocationGeocodeInput, LocationGeocodeResult } from '../types';

/**
 * 내 위치(geocode) function 호출 및 주소 가공 서비스
 * @param coords - '경도,위도' 문자열 (예: '127.123,37.456')
 * @returns { address: string, adm?: string, legal?: string, results: LocationGeocodeResult[] }
 */
export async function requestMyLocationService(coords: string) {
  // Supabase Function 호출 (GET, 익명키)
  const { results, status } = await callSupabaseFunction<LocationGeocodeResult>(
    'geocode',
    { query: { coords }, anonymous: true }
  );
  if (status.code !== 0 || !results.length) {
    throw new Error(status.message || '위치 정보를 찾을 수 없습니다.');
  }
  // 행정동/법정동 정보 가공
  const adm = results.find(r => r.name === 'admcode');
  const legal = results.find(r => r.name === 'legalcode');
  const admStr = adm
    ? `${adm.region.area1?.name ?? ''} ${adm.region.area2?.name ?? ''} ${adm.region.area3?.name ?? ''}`.trim() || null
    : null;
  const legalStr = legal
    ? `${legal.region.area1?.name ?? ''} ${legal.region.area2?.name ?? ''} ${legal.region.area3?.name ?? ''}`.trim() || null
    : null;
  return {
    address: admStr || legalStr || coords,
    adm: admStr,
    legal: legalStr,
    results
  };
} 