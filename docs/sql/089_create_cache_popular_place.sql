-- =====================================================
-- 089_create_cache_popular_place.sql
-- 홈 화면 무한 스크롤을 위한 인기 콘텐츠 캐시 테이블
-- 
-- 실행 방법:
--   psql "postgresql://postgres.xyqpggpilgcdsawuvpzn:ZNDqDunnaydr0aFQ@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres" -f docs/sql/089_create_cache_popular_place.sql
-- =====================================================

-- 1. 테이블 생성
DROP TABLE IF EXISTS tbl_cache_popular_place;

CREATE TABLE tbl_cache_popular_place (
  id SERIAL PRIMARY KEY,
  
  -- 콘텐츠 식별
  content_type TEXT NOT NULL,  -- 'place', 'folder', 'naver_folder', 'youtube_channel', 'category', 'region', 'theme'
  content_id TEXT NOT NULL,    -- 해당 타입의 고유 ID
  
  -- 표시 정보
  title TEXT NOT NULL,         -- 표시명
  subtitle TEXT,               -- 부제목 (카테고리명, 지역명 등)
  thumbnail TEXT,              -- 대표 이미지 URL
  
  -- 필터링/집계용 컬럼 (place 기준, 다른 타입은 NULL 가능)
  category TEXT,               -- 음식 카테고리
  group1 TEXT,                 -- 지역 (시/도)
  group2 TEXT,                 -- 지역 (구/군)
  themes TEXT[],               -- 테마 키워드 배열 (votedKeyword에서 추출)
  review_count INTEGER,        -- 리뷰 수
  review_count_range TEXT,     -- 리뷰 범주: 'under_10', '10_50', '50_100', '100_plus'
  
  -- 정렬/랭킹
  popularity_score INTEGER DEFAULT 0,  -- 인기 점수
  place_count INTEGER,                  -- 폴더/채널의 장소 수
  random_seed INTEGER,                  -- 랜덤 정렬용 (0-999)
  
  -- 메타데이터
  metadata JSONB,              -- 추가 정보 (preview_places 등)
  batch_id TEXT,               -- 배치 식별자 (갱신 시 사용)
  created_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(content_type, content_id)
);

-- 2. 인덱스 생성
CREATE INDEX idx_cache_popular_type ON tbl_cache_popular_place(content_type);
CREATE INDEX idx_cache_popular_category ON tbl_cache_popular_place(category) WHERE category IS NOT NULL;
CREATE INDEX idx_cache_popular_group1 ON tbl_cache_popular_place(group1) WHERE group1 IS NOT NULL;
CREATE INDEX idx_cache_popular_group1_group2 ON tbl_cache_popular_place(group1, group2) WHERE group1 IS NOT NULL;
CREATE INDEX idx_cache_popular_themes ON tbl_cache_popular_place USING GIN(themes) WHERE themes IS NOT NULL;
CREATE INDEX idx_cache_popular_review_range ON tbl_cache_popular_place(review_count_range) WHERE review_count_range IS NOT NULL;
CREATE INDEX idx_cache_popular_random ON tbl_cache_popular_place(random_seed);
CREATE INDEX idx_cache_popular_score ON tbl_cache_popular_place(popularity_score DESC);

-- 3. RLS 정책
ALTER TABLE tbl_cache_popular_place ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anonymous read access" ON tbl_cache_popular_place
  FOR SELECT
  USING (true);

-- 4. 코멘트
COMMENT ON TABLE tbl_cache_popular_place IS '홈 화면 무한 스크롤을 위한 인기 콘텐츠 캐시 테이블. 1시간마다 갱신됨.';
COMMENT ON COLUMN tbl_cache_popular_place.content_type IS '콘텐츠 유형: place, folder, naver_folder, youtube_channel, category, region, theme';
COMMENT ON COLUMN tbl_cache_popular_place.content_id IS '해당 타입의 고유 식별자';
COMMENT ON COLUMN tbl_cache_popular_place.themes IS 'votedKeyword에서 추출한 테마 키워드 배열';
COMMENT ON COLUMN tbl_cache_popular_place.review_count_range IS '리뷰 수 범주: under_10, 10_50, 50_100, 100_plus';
COMMENT ON COLUMN tbl_cache_popular_place.random_seed IS '랜덤 정렬용 시드값 (0-999)';
COMMENT ON COLUMN tbl_cache_popular_place.batch_id IS '배치 갱신 시 사용하는 식별자';

SELECT 'tbl_cache_popular_place 테이블 생성 완료' as result;
