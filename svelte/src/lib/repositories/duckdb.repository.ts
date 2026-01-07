import * as duckdb from '@duckdb/duckdb-wasm';
import type { PopularReview, ParquetTableConfig } from '$lib/types/parquet';

export class DuckDBRepository {
    private static instance: DuckDBRepository;
    private db: duckdb.AsyncDuckDB | null = null;
    private tables: Map<string, ParquetTableConfig> = new Map();

    private constructor() {
        // 싱글톤 패턴
    }

    public static getInstance(): DuckDBRepository {
        if (!DuckDBRepository.instance) {
            DuckDBRepository.instance = new DuckDBRepository();
        }
        return DuckDBRepository.instance;
    }

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

            // 기본 테이블 등록
            this.registerTable({
                name: 'popular_reviews',
                url: 'https://xyqpggpilgcdsawuvpzn.supabase.co/storage/v1/object/public/data-parquet//popular_reviews.parquet',
                type: 'popular_reviews'
            });

        } catch (error) {
            console.error('DuckDB 초기화 오류:', error);
            throw error;
        }
    }

    public registerTable(config: ParquetTableConfig): void {
        this.tables.set(config.name, config);
    }

    public async getTableRowCount(tableName: string): Promise<number> {
        if (!this.db) throw new Error('DuckDB가 초기화되지 않았습니다.');
        
        const tableConfig = this.tables.get(tableName);
        if (!tableConfig) throw new Error(`테이블 ${tableName}이(가) 등록되지 않았습니다.`);

        const startTime = performance.now();
        const conn = await this.db.connect();
        
        try {
            const result = await conn.query(`
                SELECT COUNT(*) as count 
                FROM parquet_scan('${tableConfig.url}')
            `);
            
            const endTime = performance.now();
            const executionTime = ((endTime - startTime) / 1000).toFixed(2);
            console.log(`${tableName} 테이블의 행 수: ${result.get(0)?.count} (처리 시간: ${executionTime}초)`);
            
            return result.get(0)?.count ?? 0;
        } finally {
            await conn.close();
        }
    }

    public async getTableSample<T>(tableName: string, limit: number = 10): Promise<T[]> {
        if (!this.db) throw new Error('DuckDB가 초기화되지 않았습니다.');
        
        const tableConfig = this.tables.get(tableName);
        if (!tableConfig) throw new Error(`테이블 ${tableName}이(가) 등록되지 않았습니다.`);

        const conn = await this.db.connect();
        
        try {
            const result = await conn.query(`
                SELECT * 
                FROM parquet_scan('${tableConfig.url}')
                LIMIT ${limit}
            `);
            
            return result.toArray() as T[];
        } finally {
            await conn.close();
        }
    }

    public async query<T>(tableName: string, sql: string): Promise<T[]> {
        if (!this.db) throw new Error('DuckDB가 초기화되지 않았습니다.');
        
        const tableConfig = this.tables.get(tableName);
        if (!tableConfig) throw new Error(`테이블 ${tableName}이(가) 등록되지 않았습니다.`);

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