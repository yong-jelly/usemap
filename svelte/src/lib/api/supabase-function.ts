// Supabase Edge Function 호출 공통 함수
// - 프로젝트 ID, 버전, 익명 여부를 인자로 받아 환경변수에서 처리
// - 쿼리스트링, 메서드, 바디, 헤더 등은 옵션으로 전달
// - 인증키는 익명/유저 여부에 따라 분기
// - 모든 함수는 타입 제네릭 지원

import { supabase } from "$lib/supabase";

export interface SupabaseFunctionResponse<T = any> {
  status: { code: number; name: string; message: string };
  results: T[];
}

interface CallSupabaseFunctionOptions {
  query?: Record<string, string | number | boolean | undefined | null>;
  method?: 'GET' | 'POST';
  body?: any;
  headers?: Record<string, string>;
  version?: string; // 기본값 'v1'
  anonymous?: boolean; // 기본값 true
}

/**
 * Supabase Edge Function 호출 공통 함수
 * @param functionName - 호출할 function 이름
 * @param options - 쿼리, 메서드, 바디, 헤더, 버전, 익명 여부 등
 * @param projectId - Supabase 프로젝트 ID (환경변수 기본값)
 * @returns SupabaseFunctionResponse<T>
 */
export async function callSupabaseFunction<T = any>(
  functionName: string,
  options?: CallSupabaseFunctionOptions,
  projectId?: string
): Promise<SupabaseFunctionResponse<T>> {
  // 환경변수에서 프로젝트 ID, 키값 읽기
  const supabaseProjectId = projectId || import.meta.env.VITE_SUPABASE_PROJECT_ID;
  const version = options?.version || 'v1';
  const isAnonymous = options?.anonymous !== false; // 기본 true
  const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh5cXBnZ3BpbGdjZHNhd3V2cHpuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQxMTA2MjYsImV4cCI6MjA1OTY4NjYyNn0.JbFl5dmVd3yPw6mnvvakn9T43_zbsTsJqhEK6D8qbtM'
//   import.meta.env.VITE_SUPABASE_ANON_KEY;
  const serviceKey = import.meta.env.VITE_SUPABASE_SERVICE_KEY;
  const apiKey = isAnonymous ? anonKey : serviceKey;

  const { data: { session } } = await supabase.auth.getSession();

  // URL 조립
  let url = `https://${supabaseProjectId}.supabase.co/functions/${version}/${functionName}`;
  if (options?.query) {
    const params = new URLSearchParams();
    Object.entries(options.query).forEach(([k, v]) => {
      if (v !== undefined && v !== null) params.append(k, String(v));
    });
    url += `?${params.toString()}`;
  }

  // fetch 옵션 조립
  const fetchOptions: RequestInit = {
    method: options?.method || 'GET',
    headers: {
      Authorization: `Bearer ${session?.access_token || apiKey}`,
      ...(options?.headers || {}),
    },
  };
  if (options?.body) {
    fetchOptions.body = JSON.stringify(options.body);
    fetchOptions.headers = {
      ...fetchOptions.headers,
      'Content-Type': 'application/json',
    };
  }

  // 호출
  const res = await fetch(url, fetchOptions);
  if (!res.ok) throw new Error('Supabase Function 호출 실패');
  return res.json();
}

export async function callSupabaseFunction2(
  functionName: string,
  options?: CallSupabaseFunctionOptions,
  projectId?: string
): Promise<Response> {
  // 환경변수에서 프로젝트 ID, 키값 읽기
  const supabaseProjectId = projectId || import.meta.env.VITE_SUPABASE_PROJECT_ID;
  const version = options?.version || 'v1';
  const isAnonymous = options?.anonymous !== false; // 기본 true
  const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh5cXBnZ3BpbGdjZHNhd3V2cHpuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQxMTA2MjYsImV4cCI6MjA1OTY4NjYyNn0.JbFl5dmVd3yPw6mnvvakn9T43_zbsTsJqhEK6D8qbtM'
//   import.meta.env.VITE_SUPABASE_ANON_KEY;
  const serviceKey = import.meta.env.VITE_SUPABASE_SERVICE_KEY;
  const apiKey = isAnonymous ? anonKey : serviceKey;

  // URL 조립
  let url = `https://${supabaseProjectId}.supabase.co/functions/${version}/${functionName}`;
  if (options?.query) {
    const params = new URLSearchParams();
    Object.entries(options.query).forEach(([k, v]) => {
      if (v !== undefined && v !== null) params.append(k, String(v));
    });
    url += `?${params.toString()}`;
  }

  const { data: { session } } = await supabase.auth.getSession();
  // console.log('##session', session);
  // fetch 옵션 조립
  const fetchOptions: RequestInit = {
    method: options?.method || 'GET',
    headers: {
      Authorization: `Bearer ${session?.access_token || apiKey}`,
      ...(options?.headers || {}),
    },
  };
  if (options?.body) {
    fetchOptions.body = JSON.stringify(options.body);
    fetchOptions.headers = {
      ...fetchOptions.headers,
      'Content-Type': 'application/json',
    };
  }

  // 호출
  return await fetch(url, fetchOptions)
}


interface SearchPlaceResponse {
  code: number;
  count: number;
  rows: any[];
  param: {
    query: string;
    start: number;
    display: number;
  };
}

interface SearchPlaceResult {
  error: boolean;
  message?: string;
  count: number;
  items: any[];
  param: {
    query: string;
    start: number;
    display: number;
  };
}

/**
 * 장소 검색 서비스
 * @param query - 검색어
 * @param start - 시작 인덱스 (기본값: 1)
 * @param display - 표시할 개수 (기본값: 100)
 * @returns 검색 결과
 */
export async function searchPlaceService(query: string, start = 1, display = 100): Promise<SearchPlaceResult> {
  try {
    const response = await callSupabaseFunction2('graph-search-place', {
      method: 'POST',
      body: { query, start, display },
      anonymous: true
    });

    const result = await response.json();

    if (result.code !== 200) {
      throw new Error('검색 중 오류가 발생했습니다.');
    }

    return {
      error: false,
      count: result.count,
      items: result.rows,
      param: result.param
    };
  } catch (error: any) {
    return {
      error: true,
      message: error.message || '검색 중 오류가 발생했습니다.',
      count: 0,
      items: [],
      param: { query, start, display }
    };
  }
}
