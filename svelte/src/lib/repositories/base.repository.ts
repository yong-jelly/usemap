import * as duckdb from '@duckdb/duckdb-wasm';
import type { ParquetTableConfig } from '$lib/types/parquet';

export interface IBaseRepository {
    initialize(): Promise<void>;
    getTableRowCount(): Promise<number>;
    getTableSample<T>(limit?: number): Promise<T[]>;
    query<T>(sql: string): Promise<T[]>;
    terminate(): Promise<void>;
}

export abstract class BaseRepository implements IBaseRepository {
    protected db: duckdb.AsyncDuckDB | null = null;
    protected abstract tableConfig: ParquetTableConfig;

    public async initialize(): Promise<void> {
        if (this.db) return;

        try {
            const JSDELIVR_BUNDLES = duckdb.getJsDelivrBundles();
            const bundle = await duckdb.selectBundle(JSDELIVR_BUNDLES);
            
            const worker_url = URL.createObjectURL(
                new Blob([`importScripts("${bundle.mainWorker!}");`], {type: 'text/javascript'})
            );

            const worker = new Worker(worker_url);
            const logger = new duckdb.ConsoleLogger();
            this.db = new duckdb.AsyncDuckDB(logger, worker);
            await this.db.instantiate(bundle.mainModule, bundle.pthreadWorker);
            URL.revokeObjectURL(worker_url);

        } catch (error) {
            console.error('DuckDB 초기화 오류:', error);
            throw error;
        }
    }

    public async getTableRowCount(): Promise<number> {
        if (!this.db) throw new Error('DuckDB가 초기화되지 않았습니다.');

        const startTime = performance.now();
        const conn = await this.db.connect();
        
        try {
            const result = await conn.query(`
                SELECT COUNT(*) as count 
                FROM parquet_scan('${this.tableConfig.url}')
            `);
            
            const endTime = performance.now();
            const executionTime = ((endTime - startTime) / 1000).toFixed(2);
            console.log(`${this.tableConfig.name} 테이블의 행 수: ${result.get(0)?.count} (처리 시간: ${executionTime}초)`);
            
            return result.get(0)?.count ?? 0;
        } finally {
            await conn.close();
        }
    }


    public async getTableSample<T>(limit: number = 10): Promise<T[]> {
        if (!this.db) throw new Error('DuckDB가 초기화되지 않았습니다.');

        const conn = await this.db.connect();
        
        try {
            const result = await conn.query(`
                SELECT * 
                FROM parquet_scan('${this.tableConfig.url}')
                LIMIT ${limit}
            `);
            
            return result.toArray() as T[];
        } finally {
            await conn.close();
        }
    }

    public async query<T>(sql: string): Promise<T[]> {
        if (!this.db) throw new Error('DuckDB가 초기화되지 않았습니다.');

        const conn = await this.db.connect();
        
        try {
            const result = await conn.query(sql);
            return result.toArray() as T[];
        } finally {
            await conn.close();
        }
    }

    public async terminate(): Promise<void> {
        if (this.db) {
            await this.db.terminate();
            this.db = null;
        }
    }
} 