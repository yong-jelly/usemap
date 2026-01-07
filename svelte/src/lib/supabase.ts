import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

// Supabase 클라이언트 생성
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// 공통 메타 정보
export interface ApiMeta {
	timestamp: string;
	message: string;
	code: number;
	// RPC의 추가 메타데이터 (필요시 확장)
	rpc?: {
		functionName?: string;
		executionTime?: number;
	};
}

// 모든 API 응답의 기본 형태
export interface ApiResponse<T = any> {
	meta: ApiMeta;
	result: {
		rows: T[];
	};
}

type RpcResponse<T> = { data: T[] | null; error: any };

export async function execute(functionName: string, dto: object) {
	const { data, error } = await supabase.rpc(
		functionName,
		dto,
	);

	if (error) throw error;

	return data;
}
export async function execute_for_list<T>(functionName: string, dto: object): Promise<ApiResponse<T>> {
	const startTime = Date.now();
	const { data, error }: RpcResponse<T> = await supabase.rpc(functionName, dto);

	const meta: ApiMeta = {
		timestamp: new Date().toISOString(),
		message: error?.message || 'Success',
		code: error?.status || 200,
		rpc: {
			functionName,
			executionTime: Date.now() - startTime,
		},
	};

	if (error) {
		throw { epoch: Date.now(), meta, result: { rows: [] } };
	}

	return {
		meta,
		result: { rows: data || [] },
	};
}
