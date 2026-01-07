import { supabase } from "@/shared/lib/supabase";

/**
 * 표준 API 응답 인터페이스
 * SQL의 generate_response 함수 응답 구조와 일치합니다.
 */
export interface ApiResponse<T> {
  meta: {
    code: number;
    message: string;
    timestamp: string;
    function: string;
    params: any;
    execution_time: number;
  };
  data: T[];
}

/**
 * 공통 API 클라이언트
 * Supabase RPC 호출을 추상화하고 응답 형식을 표준화합니다.
 */
export const apiClient = {
  /**
   * Supabase RPC(Stored Procedure)를 호출합니다.
   * 
   * @param fn - 호출할 데이터베이스 함수 이름
   * @param params - 함수에 전달할 매개변수 객체
   * @returns ApiResponse 형식으로 래핑된 결과
   */
  async rpc<T = any>(
    fn: string,
    params: any = {}
  ): Promise<ApiResponse<T>> {
    const startTime = performance.now();
    
    try {
      // Supabase RPC 호출
      const { data, error } = await supabase.rpc(fn, params);
      
      if (error) {
        throw error;
      }
      
      // 이미 DB 수준에서 generate_response로 래핑되어 온 경우
      if (data && data.meta && data.data) {
        return data as ApiResponse<T>;
      }
      
      // 기본 응답인 경우 클라이언트 측에서 표준 형식으로 래핑
      const endTime = performance.now();
      return {
        meta: {
          code: 200,
          message: "Success",
          timestamp: new Date().toISOString(),
          function: fn,
          params: params,
          execution_time: endTime - startTime,
        },
        data: Array.isArray(data) ? data : data ? [data] : [],
      };
    } catch (error: any) {
      // 오류 발생 시에도 표준 응답 형식 유지
      console.error(`API Error (${fn}):`, error);
      return {
        meta: {
          code: error.code || 500,
          message: error.message || "Internal Server Error",
          timestamp: new Date().toISOString(),
          function: fn,
          params: params,
          execution_time: performance.now() - startTime,
        },
        data: [],
      };
    }
  },
};
