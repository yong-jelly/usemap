import type { ApiConfig, ApiResponse, ApiError } from "$services/types";
import { API_CONFIG } from "$config/api.config";

/**
 * HTTP 요청을 처리하는 API 클라이언트 클래스
 */
class ApiClient {
  // API 설정을 저장하는 private 멤버 변수
  private config: ApiConfig;

  /**
   * API 클라이언트 인스턴스를 생성합니다
   * @param config - API 설정 객체
   */
  constructor(config: ApiConfig) {
    this.config = config;
  }

  /**
   * HTTP 요청을 실행하고 응답을 처리하는 핵심 메서드
   * @param input - 요청 URL 또는 Request 객체
   * @param init - 요청 설정 객체
   * @param useCustomBaseUrl - 외부 API URL을 사용할지 여부
   * @returns Promise<ApiResponse> - API 응답 데이터
   */
  private async handleRequest(
    input: RequestInfo,
    init?: RequestInit,
    useCustomBaseUrl: boolean = false
  ): Promise<ApiResponse> {
    try {
      // 요청 전 인터셉터를 통해 헤더 등을 수정
      const modifiedInit = await this.requestInterceptor(init || {});

      // baseURL과 엔드포인트를 조합하여 최종 URL 생성
      const url = typeof input === "string" 
        ? (useCustomBaseUrl ? input : `${this.config.baseURL}${input}`)
        : input;

      // fetch API를 사용하여 실제 HTTP 요청 수행
      const response = await fetch(url, modifiedInit);

      // 응답 인터셉터를 통해 응답 데이터 처리
      return await this.responseInterceptor(response);
    } catch (error) {
      // 에러 발생 시 ApiError 형식으로 변환하여 throw
      const apiError: ApiError = new Error("API request failed");
      if (error instanceof Error) {
        apiError.message = error.message;
      }
      throw apiError;
    }
  }

  /**
   * 요청 전에 실행되는 인터셉터
   * 인증 토큰과 기본 헤더를 설정합니다
   * @param init - 원본 요청 설정 객체
   * @returns Promise<RequestInit> - 수정된 요청 설정 객체
   */
  private async requestInterceptor(init: RequestInit): Promise<RequestInit> {
    const sessionData = null;//session.get();
    const token = null;//sessionData?.token || null;

    // 헤더 설정
    const headers = new Headers(init.headers || {});
    headers.set("Content-Type", "application/json");

    // 인증 토큰이 있으면 Authorization 헤더 추가
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
    console.log(`header token: ${token}`);
    return {
      ...init,
      headers,
    };
  }

  /**
   * 응답을 처리하는 인터셉터
   * 에러 체크 및 응답 데이터 파싱을 수행합니다
   * @param response - fetch API의 Response 객체
   * @returns Promise<ApiResponse> - 처리된 API 응답 데이터
   */
  private async responseInterceptor(response: Response): Promise<ApiResponse> {
    // HTTP 상태 코드가 200번대가 아닌 경우 에러 처리
    if (!response.ok) {
      const error: ApiError = new Error("API response error");
      error.status = response.status;
      throw error;
    }

    // JSON 응답 파싱
    const data = await response.json();
    return {
      meta: data.meta,
      result: data.result,
    }
    // return data;
    // 응답 데이터 구조화
    // return {
    //   data,
    //   status: response.status,
    //   statusText: response.statusText,
    //   headers: response.headers,
    // };
  }

  /**
   * GET 요청 메서드
   * @param url - 요청 엔드포인트
   * @param init - 추가 요청 설정
   * @param useCustomBaseUrl - 외부 API URL을 사용할지 여부
   */
  async get<T>(url: string, init?: RequestInit, useCustomBaseUrl: boolean = false): Promise<ApiResponse<T>> {
    return this.handleRequest(url, {
      ...init,
      method: "GET",
    }, useCustomBaseUrl);
  }

  /**
   * POST 요청 메서드
   * @param url - 요청 엔드포인트
   * @param data - 요청 바디 데이터
   * @param init - 추가 요청 설정
   * @param useCustomBaseUrl - 외부 API URL을 사용할지 여부
   */
  async post<T>(
    url: string,
    data?: any,
    init?: RequestInit,
    useCustomBaseUrl: boolean = false
  ): Promise<ApiResponse<T>> {
    return this.handleRequest(url, {
      ...init,
      method: "POST",
      body: JSON.stringify(data),
    }, useCustomBaseUrl);
  }

  /**
   * PUT 요청 메서드
   * @param url - 요청 엔드포인트
   * @param data - 요청 바디 데이터
   * @param init - 추가 요청 설정
   */
  async put<T>(
    url: string,
    data?: any,
    init?: RequestInit
  ): Promise<ApiResponse<T>> {
    return this.handleRequest(url, {
      ...init,
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  /**
   * DELETE 요청 메서드
   * @param url - 요청 엔드포인트
   * @param init - 추가 요청 설정
   */
  async delete<T>(url: string, init?: RequestInit): Promise<ApiResponse<T>> {
    return this.handleRequest(url, {
      ...init,
      method: "DELETE",
    });
  }
}

// API 클라이언트 인스턴스를 생성하고 export
const apiClient = new ApiClient(API_CONFIG);

export default apiClient;
