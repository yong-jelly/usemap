import { Database } from "bun:sqlite";

/**
 * SQLite 데이터베이스 관리 클래스
 */
export class MapDatabase {
  private db: Database;

  constructor(dbPath: string = "map_data.sqlite") {
    this.db = new Database(dbPath);
    this.init();
  }

  /**
   * 테이블 초기화 및 성능 최적화 설정
   * 
   * [설정: WAL(Write-Ahead Logging)]
   * - 읽기와 쓰기 작업을 동시에 수행할 수 있게 하여 성능을 크게 향상시킵니다.
   */
  private init() {
    this.db.run(`PRAGMA journal_mode = WAL;`);

    // tbl_place: 음식점 기본 정보
    this.db.run(`
      CREATE TABLE IF NOT EXISTS tbl_place (
        id TEXT PRIMARY KEY,
        name TEXT,
        road TEXT,
        category TEXT,
        category_code TEXT,
        category_code_list TEXT,
        road_address TEXT,
        payment_info TEXT,
        conveniences TEXT,
        address TEXT,
        group1 TEXT,
        group2 TEXT,
        group3 TEXT,
        phone TEXT,
        visitor_reviews_total INTEGER,
        visitor_reviews_score REAL,
        x TEXT,
        y TEXT,
        homepage TEXT,
        keyword_list TEXT,
        images TEXT,
        static_map_url TEXT,
        themes TEXT,
        visitor_review_medias_total INTEGER,
        visitor_review_stats TEXT,
        menus TEXT,
        street_panorama TEXT,
        place_images TEXT,
        upsert_at DATETIME,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // tbl_place_info: 추가 상세 정보
    this.db.run(`
      CREATE TABLE IF NOT EXISTS tbl_place_info (
        business_id TEXT PRIMARY KEY,
        business_name TEXT,
        address TEXT,
        convenience TEXT,
        direction TEXT,
        payment_methods TEXT,
        website TEXT,
        description TEXT,
        url TEXT,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // tbl_place_review: 리뷰 데이터 (추후 확장 가능)
    this.db.run(`
      CREATE TABLE IF NOT EXISTS tbl_place_review (
        id TEXT PRIMARY KEY,
        rating REAL,
        author_id TEXT,
        author_nickname TEXT,
        author_from TEXT,
        author_object_id TEXT,
        author_url TEXT,
        body TEXT,
        media TEXT,
        visit_count INTEGER,
        view_count INTEGER,
        visited TEXT,
        created TEXT,
        business_name TEXT,
        business_id TEXT,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // tbl_place_analysis: 통계/키워드 분석
    this.db.run(`
      CREATE TABLE IF NOT EXISTS tbl_place_analysis (
        business_id TEXT PRIMARY KEY,
        review_avg_rating REAL,
        total_reviews INTEGER,
        themes TEXT,
        menus TEXT,
        voted TEXT,
        voted_sum_count INTEGER,
        voted_user_count INTEGER,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // box_status: 박스 처리 상태 (재시작/재개)
    this.db.run(`
      CREATE TABLE IF NOT EXISTS box_status (
        box TEXT PRIMARY KEY,
        status TEXT,
        km REAL,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // tbl_crawl_fail: 크롤링 실패 항목 기록 (429 에러 등)
    this.db.run(`
      CREATE TABLE IF NOT EXISTS tbl_crawl_fail (
        business_id TEXT PRIMARY KEY,
        business_name TEXT,
        reason TEXT,
        box TEXT,
        km REAL,
        retry_count INTEGER DEFAULT 0,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 기존 테이블에 retry_count 컬럼이 없으면 추가 (마이그레이션)
    try {
      this.db.run(`ALTER TABLE tbl_crawl_fail ADD COLUMN retry_count INTEGER DEFAULT 0`);
    } catch {
      // 이미 컬럼이 존재하면 무시
    }

    // tbl_place 테이블에 upsert_at 컬럼 추가 (마이그레이션)
    try {
      this.db.run(`ALTER TABLE tbl_place ADD COLUMN upsert_at DATETIME`);
    } catch {
      // 이미 컬럼이 존재하면 무시
    }
  }

  /**
   * 장소 정보를 저장하거나 업데이트합니다. (Upsert)
   * 
   * [알고리즘: Upsert (Insert or Update)]
   * 1. 데이터를 삽입을 시도합니다.
   * 2. ID가 중복(CONFLICT)될 경우, 기존 레코드를 새로운 값으로 업데이트합니다.
   * 3. 이 과정을 통해 데이터 중복을 방지하고 최신 상태를 유지합니다.
   */
  upsertPlace(data: any) {
    const columns = Object.keys(data);
    const placeholders = columns.map(() => "?").join(", ");
    const updates = columns.map(col => `${col} = EXCLUDED.${col}`).join(", ");
    
    const query = `
      INSERT INTO tbl_place (${columns.join(", ")})
      VALUES (${placeholders})
      ON CONFLICT(id) DO UPDATE SET ${updates}, updated_at = CURRENT_TIMESTAMP
    `;
    
    const values = Object.values(data) as any[];
    this.db.prepare(query).run(...values);
  }

  /**
   * 분석 데이터를 저장하거나 업데이트합니다. (Upsert)
   */
  upsertAnalysis(data: any) {
    const columns = Object.keys(data);
    const placeholders = columns.map(() => "?").join(", ");
    const updates = columns.map(col => `${col} = EXCLUDED.${col}`).join(", ");

    const query = `
      INSERT INTO tbl_place_analysis (${columns.join(", ")})
      VALUES (${placeholders})
      ON CONFLICT(business_id) DO UPDATE SET ${updates}, updated_at = CURRENT_TIMESTAMP
    `;

    const values = Object.values(data) as any[];
    this.db.prepare(query).run(...values);
  }

  /**
   * 박스 처리 상태 저장
   */
  saveBoxStatus(box: string, status: string, km: number) {
    this.db.prepare(`
      INSERT INTO box_status (box, status, km, updated_at)
      VALUES (?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(box) DO UPDATE SET status = EXCLUDED.status, updated_at = CURRENT_TIMESTAMP
    `).run(box, status, km);
  }

  /**
   * 박스 처리 상태 조회
   */
  getBoxStatus(box: string) {
    return this.db.prepare("SELECT * FROM box_status WHERE box = ?").get(box);
  }

  /**
   * 크롤링 실패 항목 저장 (재시도 횟수 증가)
   */
  saveFail(data: { business_id: string; business_name: string; reason: string; box: string; km: number }) {
    const { business_id, business_name, reason, box, km } = data;
    this.db.prepare(`
      INSERT INTO tbl_crawl_fail (business_id, business_name, reason, box, km, retry_count, updated_at)
      VALUES (?, ?, ?, ?, ?, 1, CURRENT_TIMESTAMP)
      ON CONFLICT(business_id) DO UPDATE SET 
        reason = EXCLUDED.reason,
        retry_count = retry_count + 1,
        updated_at = CURRENT_TIMESTAMP
    `).run(business_id, business_name, reason, box, km);
  }

  /**
   * 저장된 장소 수 조회 (재실행 시 카운트 초기화용)
   */
  getPlaceCount(): number {
    const result = this.db.prepare("SELECT COUNT(*) as count FROM tbl_place").get() as { count: number };
    return result?.count ?? 0;
  }

  /**
   * 장소 존재 여부 확인 (중복 저장 방지용)
   */
  hasPlace(id: string): boolean {
    const result = this.db.prepare("SELECT 1 FROM tbl_place WHERE id = ?").get(id);
    return !!result;
  }

  /**
   * 재시도 가능한 실패 항목 조회 (retry_count < maxRetry)
   */
  getRetryableFailedItems(maxRetry: number = 5): Array<{
    business_id: string;
    business_name: string;
    reason: string;
    box: string;
    km: number;
    retry_count: number;
  }> {
    return this.db.prepare(`
      SELECT business_id, business_name, reason, box, km, retry_count 
      FROM tbl_crawl_fail 
      WHERE retry_count < ?
      ORDER BY retry_count ASC, updated_at ASC
    `).all(maxRetry) as any[];
  }

  /**
   * 실패 항목 삭제 (성공 시 호출)
   */
  removeFail(businessId: string) {
    this.db.prepare("DELETE FROM tbl_crawl_fail WHERE business_id = ?").run(businessId);
  }

  /**
   * 실패 항목 통계 조회
   */
  getFailStats(): { total: number; retryable: number; maxedOut: number } {
    const total = (this.db.prepare("SELECT COUNT(*) as count FROM tbl_crawl_fail").get() as any)?.count ?? 0;
    const retryable = (this.db.prepare("SELECT COUNT(*) as count FROM tbl_crawl_fail WHERE retry_count < 5").get() as any)?.count ?? 0;
    const maxedOut = (this.db.prepare("SELECT COUNT(*) as count FROM tbl_crawl_fail WHERE retry_count >= 5").get() as any)?.count ?? 0;
    return { total, retryable, maxedOut };
  }
}
