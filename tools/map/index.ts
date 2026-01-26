import { CrawlerPipeline } from "./src/pipeline";
import { unlinkSync, existsSync } from "fs";
import { join } from "path";

/**
 * 실행 방법:
 * 1. 기본 실행 (전국 단위, 기존 DB 이어하기):
 *    bun tools/map/index.ts
 * 
 * 2. 특정 지역 실행 (예: 대전):
 *    bun tools/map/index.ts search daejeon
 * 
 * 3. DB 초기화 후 새로 시작:
 *    bun tools/map/index.ts search --init
 * 
 * 4. 커스텀 DB 파일 사용:
 *    bun tools/map/index.ts search --db=my_data.sqlite
 * 
 * 5. 실패 항목 재시도:
 *    bun tools/map/index.ts retry
 * 
 * 실행 인자 분석:
 * command: 실행 모드 (기본값: search, retry 가능)
 * region: 검색 영역 (옵션, 'daejeon' 입력 시 대전 영역, 미입력 시 전국)
 * --db: DB 파일 경로 및 이름 (기본값: map_data.sqlite)
 * --init: 기존 DB 파일 삭제 후 새로 시작
 */
const args = Bun.argv.slice(2);

// 인자가 없거나 첫 번째 인자가 옵션(--)으로 시작하면 기본 명령 'search' 사용
const command = (args[0] && !args[0].startsWith("-")) ? args[0] : "search";

// 지역 인자 찾기 (명령어가 아니고 옵션이 아닌 첫 번째 인자)
const regionArg = args.find(arg => !arg.startsWith("-") && arg !== command);

// 옵션 추출
const dbPathArg = args.find(arg => arg.startsWith("--db="))?.split("=")[1];
const shouldInit = args.includes("--init");

const dbFileName = dbPathArg || "map_data.sqlite";
const dbFullPath = join(process.cwd(), dbFileName);

// 모든 실행 인자 로그 출력
console.log("========================================");
console.log("🛠️  실행 환경 설정");
console.log(`- Command: ${command}`);
console.log(`- Region Argument: ${regionArg || "(기본값: 전국)"}`);
console.log(`- DB Path: ${dbFullPath}`);
console.log(`- Init Mode: ${shouldInit}`);
console.log("========================================\n");

/**
 * 초기화 옵션 처리
 */
if (shouldInit && existsSync(dbFullPath)) {
  console.log(`[Init] 기존 DB 파일을 삭제하고 새로 시작합니다: ${dbFullPath}`);
  unlinkSync(dbFullPath);
}

const pipeline = new CrawlerPipeline(dbFullPath);

/**
 * 메인 실행 함수
 */
async function main() {
  if (command === "search") {
    // 기본값: 전국 영역
    let initialBox = "126.7982;34.9869;129.4446;38.5311";
    let regionName = "전국";

    // 인자값이 'daejeon'인 경우 대전 영역으로 설정
    if (regionArg === "daejeon") {
      initialBox = "127.217576;36.273057;127.558584;36.453337";
      regionName = "대전";
    }
// 
    console.log(`🚀 [${regionName}] 영역 데이터 수집을 시작합니다.`);
    console.log(`📍 좌표 범위: ${initialBox}`);
    console.log(`🗄️  DB 파일: ${dbFullPath}`);
    
    await pipeline.search(initialBox);
  } else {
    console.log(`
사용법: bun index.ts [명령] [옵션]

명령:
  search   - 데이터 수집 시작 (기본값)

지역 옵션:
  daejeon  - 대전 지역 한정 검색 (미입력 시 전국 검색)

시스템 옵션:
  --db=파일명  - DB 파일 이름 지정 (기본값: map_data.sqlite)
  --init      - 기존 DB 파일이 있을 경우 삭제 후 새로 시작 (이어하기 안함)

예시:
  bun index.ts search                    # 전국 검색, 기존 DB 이어하기
  bun index.ts search daejeon --init     # 대전 검색, DB 초기화 후 새로 시작
  bun index.ts search --db=seoul.sqlite  # 전국 검색, seoul.sqlite 파일 사용
    `);
  }
}

main().catch((err) => {
  console.error("❌ 치명적 오류 발생:");
  console.error(err);
  process.exit(1);
});
