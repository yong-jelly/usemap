import { writable } from 'svelte/store';

/**
 * Svelte 기반 글로벌 KV 버킷 스토어
 * - 버킷명(네임스페이스)별로 Map을 관리
 * - set/get/has/delete/clear 지원
 * - Svelte store이므로 구독/reactivity 지원
 * - 로컬 스토리지에 자동 동기화
 * - 각 값별 초단위 만료(expire) 지원
 *
 * 사용 예시:
 *   bucketStore.set('user', 'token', 'abc', 60); // 60초 후 만료
 *   bucketStore.get('user', 'token'); // 만료 전: 'abc', 만료 후: undefined
 *   bucketStore.has('user', 'token'); // 만료 전: true, 만료 후: false
 */

/**
 * 버킷에 저장되는 값의 구조
 * @property value   실제 저장 값
 * @property expireAt 만료 시각(UNIX timestamp, 초). 0이면 무제한
 */
type BucketValue = { value: any; expireAt: number };

/**
 * 버킷별 Map 구조 (key: string, value: BucketValue)
 */
type BucketMap = Map<string, BucketValue>;

/**
 * 전체 버킷 Map (bucket명: string, value: BucketMap)
 */
type Buckets = Map<string, BucketMap>;

const LOCAL_STORAGE_KEY = 'bucketStore';

/**
 * Map을 재귀적으로 일반 객체로 변환 (로컬 스토리지 저장용)
 */
function mapToObj(map: Map<string, any>): Record<string, any> {
  const obj: Record<string, any> = {};
  for (const [k, v] of map.entries()) {
    obj[k] = v instanceof Map ? mapToObj(v) : v;
  }
  return obj;
}

/**
 * 객체를 재귀적으로 Map으로 변환 (로컬 스토리지 복원용)
 */
function objToMap(obj: Record<string, any>): Map<string, any> {
  const map = new Map();
  for (const k in obj) {
    map.set(k, typeof obj[k] === 'object' && obj[k] !== null && !Array.isArray(obj[k]) ? objToMap(obj[k]) : obj[k]);
  }
  return map;
}

/**
 * Buckets를 로컬 스토리지에 저장
 */
function saveToLocalStorage(buckets: Buckets) {
  const obj = mapToObj(buckets);
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(obj));
}

/**
 * 로컬 스토리지에서 Buckets를 복원
 * @returns Buckets 객체, 없거나 파싱 실패 시 빈 Map 반환
 */
function loadFromLocalStorage(): Buckets {
  const str = localStorage.getItem(LOCAL_STORAGE_KEY);
  if (!str) return new Map();
  try {
    const obj = JSON.parse(str);
    return objToMap(obj) as Buckets;
  } catch {
    return new Map();
  }
}

/**
 * 현재 시각(초, UNIX timestamp)
 */
function now(): number {
  return Math.floor(Date.now() / 1000);
}

/**
 * BucketValue가 만료되었는지 확인
 * @param entry BucketValue 또는 undefined
 * @returns true: 만료됨/없음, false: 유효
 */
function isExpired(entry?: BucketValue) {
  if (!entry) return true;
  if (entry.expireAt === 0) return false;
  return now() > entry.expireAt;
}

/**
 * Svelte 버킷 스토어 생성 함수
 * - subscribe: Svelte store 구독
 * - get: 값 조회 (만료 시 undefined 반환 및 자동 삭제)
 * - set: 값 저장 (expire: 초단위, 0=무제한)
 * - has: 값 존재 여부 (만료 시 false 및 자동 삭제)
 * - delete: 값 삭제
 * - clear: 버킷 전체 삭제
 */
function createBucketStore() {
  // 내부 buckets 상태: 버킷별 Map
  const buckets: Buckets = loadFromLocalStorage();
  const { subscribe, set, update } = writable(buckets);

  /**
   * buckets 상태를 로컬 스토리지에 저장 및 Svelte store 갱신
   */
  function persist() {
    saveToLocalStorage(buckets);
    update(b => b);
  }

  return {
    subscribe,
    /**
     * 값 조회
     * @param bucket 버킷명(네임스페이스)
     * @param key    키
     * @returns      저장된 값, 만료/없음 시 undefined
     * @example
     *   bucketStore.get('user', 'token')
     */
    get(bucket: string, key: string) {
      const entry = buckets.get(bucket)?.get(key);
      // console.log('[** [get] entry]', entry);
      if (!entry) return undefined; // 값 없음
      // console.log('[** [get] isExpired]', isExpired(entry));
      if (isExpired(entry)) {
        // 만료 시 자동 삭제
        buckets.get(bucket)?.delete(key);
        persist();
        return undefined;
      }
      
      if (entry instanceof Map) { 
        return entry.get('value');
      } else {
        return entry.value;
      }
    },
    /**
     * 값 저장
     * @param bucket 버킷명(네임스페이스)
     * @param key    키
     * @param value  저장할 값
     * @param expire 만료(초), 0=무제한, 기본값: 300(5분)
     * @example
     *   bucketStore.set('user', 'token', 'abc', 60) // 60초 후 만료
     */
    set(bucket: string, key: string, value: any, expire: number = 5 * 60) {
      if (!buckets.has(bucket)) buckets.set(bucket, new Map());
      const expireAt = expire > 0 ? now() + expire : 0;
      buckets.get(bucket)!.set(key, { value, expireAt });
      persist();
    },
    /**
     * 값 존재 여부 확인
     * @param bucket 버킷명(네임스페이스)
     * @param key    키
     * @returns      true: 존재(만료 전), false: 없음/만료됨
     * @example
     *   bucketStore.has('user', 'token')
     */
    has(bucket: string, key: string) {
      const entry = buckets.get(bucket)?.get(key);
      if (!entry) return false; // 값 없음
      if (isExpired(entry)) {
        // 만료 시 자동 삭제
        buckets.get(bucket)?.delete(key);
        persist();
        return false;
      }
      return true;
    },
    /**
     * 값 삭제
     * @param bucket 버킷명(네임스페이스)
     * @param key    키
     * @example
     *   bucketStore.delete('user', 'token')
     */
    delete(bucket: string, key: string) {
      buckets.get(bucket)?.delete(key);
      persist();
    },
    /**
     * 버킷 전체 삭제
     * @param bucket 버킷명(네임스페이스)
     * @example
     *   bucketStore.clear('user')
     */
    clear(bucket: string) {
      buckets.get(bucket)?.clear();
      persist();
    },
    /**
     * 모든 버킷과 데이터를 완전히 초기화
     * @example
     *   bucketStore.reset()
     */
    reset() {
      buckets.clear();
      persist();
    },
    /**
     * 전체 버킷의 키값 목록 조회
     * @returns { [bucket: string]: string[] } 버킷별 키 배열 객체
     * @example
     *   bucketStore.keys() // { user: ['token', ...], ... }
     */
    keys(): Record<string, string[]> {
      const result: Record<string, string[]> = {};
      for (const [bucket, map] of buckets.entries()) {
        result[bucket] = Array.from(map.keys());
      }
      return result;
    }
  };
}

/**
 * 글로벌 버킷 스토어 인스턴스
 */
export const bucketStore = createBucketStore(); 