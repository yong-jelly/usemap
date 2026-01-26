import { Database } from "bun:sqlite";
import { sql, toSqlArray } from "../shared/db";
import { join } from "path";

/**
 * 실행 방법:
 * bun tools/map/upsert_to_supabase.ts [--db=map_data.sqlite] [--batch-size=100] [--delay=100] [--force]
 */

const args = Bun.argv.slice(2);
const dbPathArg = args.find(arg => arg.startsWith("--db="))?.split("=")[1];
const batchSizeArg = args.find(arg => arg.startsWith("--batch-size="))?.split("=")[1];
const delayArg = args.find(arg => arg.startsWith("--delay="))?.split("=")[1];
const isForce = args.includes("--force");

const dbFileName = dbPathArg || "map_data.sqlite";
const dbFullPath = join(process.cwd(), dbFileName);
const BATCH_SIZE = parseInt(batchSizeArg || "100", 10);
const DELAY_MS = parseInt(delayArg || "100", 10);

console.log("========================================");
console.log("🚀 SQLite -> Supabase Upsert 시작");
console.log(`- DB Path: ${dbFullPath}`);
console.log(`- Batch Size: ${BATCH_SIZE}`);
console.log(`- Delay: ${DELAY_MS}ms`);
console.log(`- Force Mode: ${isForce}`);
console.log("========================================\n");

if (!require("fs").existsSync(dbFullPath)) {
  console.error(`❌ DB 파일을 찾을 수 없습니다: ${dbFullPath}`);
  process.exit(1);
}

const sqlite = new Database(dbFullPath);

// upsert_at 컬럼이 없는 경우를 대비한 자동 마이그레이션
try {
  sqlite.run("ALTER TABLE tbl_place ADD COLUMN upsert_at DATETIME");
  console.log("ℹ️  SQLite: upsert_at 컬럼이 추가되었습니다.");
} catch (e) {
  // 이미 컬럼이 존재하는 경우 무시
}

try {
  sqlite.run("CREATE INDEX IF NOT EXISTS idx_tbl_place_upsert_at ON tbl_place (upsert_at)");
  console.log("ℹ️  SQLite: upsert_at 인덱스가 생성/확인되었습니다.");
} catch (e) {
  // 인덱스 생성 실패 시 무시
}

/**
 * 연결 테스트 및 초기화
 */
async function checkConnections() {
  console.log("🔍 연결 테스트 중...");
  
  // 1. SQLite 테스트
  try {
    sqlite.prepare("SELECT 1").get();
    console.log("✅ SQLite 연결 성공");
  } catch (e: any) {
    throw new Error(`SQLite 연결 실패: ${e.message}`);
  }

  // 2. Supabase 테스트
  try {
    const result = await sql`SELECT now() as now`;
    console.log(`✅ Supabase 연결 성공 (서버 시간: ${result[0].now})`);
  } catch (e: any) {
    throw new Error(`Supabase 연결 실패: ${e.message}`);
  }
}

/**
 * SQLite 데이터를 Supabase 형식으로 변환
 */
function transformRow(row: any) {
  const arrayFields = [
    'category_code_list', 'payment_info', 'conveniences', 
    'homepage', 'keyword_list', 'images', 'themes', 'place_images'
  ];
  
  const jsonbFields = ['visitor_review_stats', 'menus', 'street_panorama'];
  
  const transformed: any = { ...row };
  
  // upsert_at은 SQLite 전용이므로 제거
  delete transformed.upsert_at;

  // 배열 필드 처리
  for (const field of arrayFields) {
    if (transformed[field]) {
      try {
        const parsed = JSON.parse(transformed[field]);
        transformed[field] = toSqlArray(Array.isArray(parsed) ? parsed : [parsed]);
      } catch (e) {
        transformed[field] = toSqlArray([transformed[field]]);
      }
    } else {
      transformed[field] = toSqlArray([]);
    }
  }

  // JSONB 필드 처리
  for (const field of jsonbFields) {
    if (transformed[field]) {
      try {
        transformed[field] = JSON.parse(transformed[field]);
      } catch (e) {
        // 파싱 실패 시 원본 유지 (Postgres가 JSONB로 받을 수 있게)
      }
    } else {
      transformed[field] = null;
    }
  }

  // numeric 타입 변환 (문자열이나 null일 수 있음)
  if (transformed.visitor_reviews_score !== undefined) {
    transformed.visitor_reviews_score = transformed.visitor_reviews_score || 0;
  }

  return transformed;
}

async function main() {
  try {
    await checkConnections();
  } catch (e: any) {
    console.error(`❌ 연결 테스트 실패: ${e.message}`);
    process.exit(1);
  }

  const whereClause = isForce ? "" : "WHERE upsert_at IS NULL";
  console.log(`🔍 대상 데이터 개수 파악 중...`);
  const totalCountRow = sqlite.prepare(`SELECT COUNT(*) as count FROM tbl_place ${whereClause}`).get() as { count: number };
  const totalToProcess = totalCountRow.count;

  if (totalToProcess === 0) {
    console.log("✅ 처리할 데이터가 없습니다.");
    return;
  }

  console.log(`📦 총 ${totalToProcess}개의 데이터를 처리해야 합니다.`);

  let successCount = 0;
  let failCount = 0;

  while (true) {
    const rows = sqlite.prepare(`
      SELECT * FROM tbl_place 
      ${whereClause}
      LIMIT ${BATCH_SIZE}
    `).all() as any[];

    if (rows.length === 0) break;

    const transformedRows = rows.map(transformRow);
    const ids = rows.map(r => r.id);

    try {
      // Supabase Upsert
      // columns를 명시적으로 지정하여 SQLite에 있는 컬럼만 처리
      const columns = Object.keys(transformedRows[0]);
      
      await sql`
        INSERT INTO public.tbl_place ${sql(transformedRows, columns)}
        ON CONFLICT (id) DO UPDATE SET
          ${sql.unsafe(columns.filter(c => c !== 'id' && c !== 'created_at').map(c => `${c} = EXCLUDED.${c}`).join(', '))}
      `;

      // SQLite 상태 업데이트
      const now = new Date().toISOString();
      const updateStmt = sqlite.prepare("UPDATE tbl_place SET upsert_at = ? WHERE id = ?");
      
      sqlite.transaction(() => {
        for (const id of ids) {
          updateStmt.run(now, id);
        }
      })();

      successCount += rows.length;
      console.log(`✅ 처리 중... (${successCount}/${totalToProcess})`);

      if (DELAY_MS > 0) {
        await new Promise(resolve => setTimeout(resolve, DELAY_MS));
      }
    } catch (error: any) {
      console.error(`❌ 배치 처리 중 오류 발생:`, error.message);
      failCount += rows.length;
      
      // 개별 처리를 시도하거나 일단 다음 배치로 넘어감
      // 여기서는 안전을 위해 루프를 중단하지 않고 다음 데이터를 시도할 수 있지만, 
      // upsert_at이 업데이트 안 되었으므로 다음 루프에서 다시 읽힐 위험이 있음.
      // 따라서 offset을 사용하거나, 에러 발생 시 해당 ID들을 skip하는 로직 필요.
      // 여기서는 단순하게 offset을 증가시키는 대신, 에러 발생 시 루프 종료를 선택하거나 
      // 에러가 난 ID들을 기록하고 넘어가는 방식이 좋음.
      
      // 일단 에러 발생 시 중단하여 원인을 파악하게 함
      break;
    }
  }

  console.log("\n========================================");
  console.log("🏁 작업 완료");
  console.log(`- 성공: ${successCount}개`);
  console.log(`- 실패: ${failCount}개`);
  console.log("========================================");
}

main().catch(err => {
  console.error("❌ 치명적 오류 발생:");
  console.error(err);
  process.exit(1);
});
