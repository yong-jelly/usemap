CREATE TABLE public.tbl_visited (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL REFERENCES auth.users(id),
    place_id varchar NOT NULL,
    visited_at timestamp with time zone DEFAULT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

COMMENT ON TABLE public.tbl_visited IS '사용자가 방문한 장소(음식점 등) 정보를 저장하는 테이블';
COMMENT ON COLUMN public.tbl_visited.id IS '방문 기록의 고유 식별자 (PK)';
COMMENT ON COLUMN public.tbl_visited.user_id IS '방문한 사용자의 ID (FK, auth.users.id 참조)';
COMMENT ON COLUMN public.tbl_visited.place_id IS '방문한 장소의 ID';
COMMENT ON COLUMN public.tbl_visited.visited_at IS '방문 일시 (YYYY-MM-DD)';
COMMENT ON COLUMN public.tbl_visited.created_at IS '방문 기록 생성 시각 (UTC)';
COMMENT ON COLUMN public.tbl_visited.updated_at IS '방문 기록 수정 시각 (UTC)';




-- 인덱스 생성: 빠른 조회를 위해
CREATE INDEX idx_tbl_visited_user_id ON public.tbl_visited (user_id);
CREATE INDEX idx_tbl_visited_user_restaurant ON public.tbl_visited (user_id, place_id);

-- RLS(행 수준 보안) 활성화: 사용자별 접근 제어
ALTER TABLE public.tbl_visited ENABLE ROW LEVEL SECURITY;

-- 사용자 본인의 방문 기록만 조회 가능
CREATE POLICY "Allow user to view their own visits"
ON public.tbl_visited FOR SELECT
USING (auth.uid() = user_id);

-- 사용자 본인만 삽입 가능
CREATE POLICY "Allow user to insert their own visits"
ON public.tbl_visited FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- 사용자 본인만 기록 수정 가능
CREATE POLICY "Allow user to update their own visits"
ON public.tbl_visited FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- (참고) 필요시 삭제 정책 추가

-- updated_at 자동 갱신 트리거(함수 필요)
CREATE TRIGGER update_tbl_visited_updated_at
BEFORE UPDATE ON public.tbl_visited
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();



-- updated_at 자동 업데이트 트리거 함수
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = timezone('utc'::text, now());
   RETURN NEW;
END;
$$ language 'plpgsql';

-- 사용자 콘텐츠 저장(북마크) 정보를 저장하는 테이블 생성
CREATE TABLE public.tbl_save (
    -- 기본 키: 각 저장 기록을 고유하게 식별
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,

    -- 사용자 ID: 어떤 사용자가 저장했는지 식별 (auth.users 테이블 참조)
    -- auth.users 테이블의 id 컬럼 (uuid)과 타입 일치 필수
    user_id uuid NOT NULL REFERENCES auth.users(id), -- ON DELETE CASCADE, -- 사용자가 삭제되면 관련 저장 기록도 삭제

    -- 저장 대상 ID: 무엇을 저장했는지 식별 (예: 리뷰 ID, 장소 ID, 게시물 ID 등)
    -- 함수에서 text 타입으로 받을 가능성이 높으므로 text 타입으로 정의
    saved_id text NOT NULL,

    -- 저장 대상 타입: 어떤 종류의 아이템을 저장했는지 구분 (예: 'place_review', 'place', 'post')
    -- 함수에서 text 타입으로 받을 가능성이 높으므로 text 타입으로 정의
    saved_type text NOT NULL,

    -- saved_id의 참조 id값이 존재시 사용 (ex, 리뷰id에 해당하는 business_id값)
    ref_saved_id text,

    -- 현재 저장 상태: 현재 아이템이 저장 목록에 있는지 여부 (true: 저장됨, false: 저장 취소됨)
    -- 좋아요 테이블의 'liked' 컬럼과 유사하게 동작
    saved boolean NOT NULL DEFAULT true,

    -- 생성 시각: 이 저장 기록이 처음 생성된 시각
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,

    -- 수정 시각: 이 저장 상태가 마지막으로 변경된 시각
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,

    -- 고유성 제약 조건: 한 사용자는 특정 아이템(saved_id, saved_type)에 대해 하나의 저장 기록만 가질 수 있도록 보장
    CONSTRAINT tbl_save_user_saved_item_unique UNIQUE (user_id, saved_id, saved_type)
);

-- 테이블 및 컬럼에 대한 주석 (설명 추가)
COMMENT ON TABLE public.tbl_save IS '사용자 콘텐츠 저장(북마크) 정보를 저장하는 테이블';
COMMENT ON COLUMN public.tbl_save.id IS '저장 기록의 고유 식별자 (PK)';
COMMENT ON COLUMN public.tbl_save.user_id IS '콘텐츠를 저장한 사용자의 ID (FK, auth.users.id 참조)';
COMMENT ON COLUMN public.tbl_save.saved_id IS '저장된 아이템의 ID (예: 장소 ID, 리뷰 ID)';
COMMENT ON COLUMN public.tbl_save.saved_type IS '저장된 아이템의 타입 (예: place, place_review)';
COMMENT ON COLUMN public.tbl_save.saved IS '현재 저장 상태 (true: 저장됨, false: 저장 취소됨)';
COMMENT ON COLUMN public.tbl_save.created_at IS '저장 기록 생성 시각 (UTC)';
COMMENT ON COLUMN public.tbl_save.updated_at IS '저장 상태 마지막 업데이트 시각 (UTC)';


-- 인덱스 생성: 자주 사용되는 조회 조건에 대한 성능 향상
-- 저장 상태 토글 함수에서 사용할 조건절에 대한 복합 인덱스
CREATE INDEX idx_tbl_save_user_saved_item ON public.tbl_save (user_id, saved_id, saved_type);

-- 사용자가 저장한 목록 조회 시 유용할 수 있는 인덱스 (saved=true 조건과 함께 사용)
CREATE INDEX idx_tbl_save_user_id_saved ON public.tbl_save (user_id, saved);


-- RLS(행 수준 보안) 활성화: 보안 강화를 위해 필요
ALTER TABLE public.tbl_save ENABLE ROW LEVEL SECURITY;

-- RLS 정책 예시 (사용자 본인의 저장 기록만 조작/조회 가능)
-- 주의: 실제 필요한 정책에 맞게 수정해야 합니다.

-- 사용자가 자신의 저장 기록을 조회할 수 있도록 허용
CREATE POLICY "Allow user to view their own saves"
ON public.tbl_save FOR SELECT
USING (auth.uid() = user_id);

-- 사용자가 자신의 저장 기록을 삽입할 수 있도록 허용
CREATE POLICY "Allow user to insert their own saves"
ON public.tbl_save FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- 사용자가 자신의 저장 기록의 'saved' 상태 및 'updated_at'을 업데이트할 수 있도록 허용
CREATE POLICY "Allow user to update their own save status"
ON public.tbl_save FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- (참고) 저장 기록 삭제 정책: 일반적으로 'saved' 플래그를 사용하므로 삭제는 제한할 수 있음
-- 필요하다면 삭제 정책 추가 가능

-- tbl_save 테이블에 트리거 적용: 행이 업데이트될 때마다 updated_at 자동 갱신
CREATE TRIGGER update_tbl_save_updated_at
BEFORE UPDATE ON public.tbl_save
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column(); -- 위에서 정의한 함수 재사용


-- 좋아요 정보를 저장하는 테이블 생성
CREATE TABLE public.tbl_like (
    -- 기본 키: 각 좋아요 기록을 고유하게 식별
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,

    -- 사용자 ID: 어떤 사용자가 좋아요를 눌렀는지 식별 (auth.users 테이블 참조)
    -- auth.users 테이블의 id 컬럼 (uuid)과 타입 일치 필수
    user_id uuid NOT NULL REFERENCES auth.users(id), -- ON DELETE CASCADE, -- 사용자가 삭제되면 관련 좋아요 기록도 삭제

    -- 좋아요 대상 ID: 무엇을 좋아요 했는지 식별 (예: 리뷰 ID, 게시물 ID 등)
    -- 함수에서 text 타입으로 받으므로 text 타입으로 정의
    liked_id text NOT NULL,

    -- 좋아요 대상 타입: 어떤 종류의 아이템을 좋아요 했는지 구분 (예: 'place_review', 'post')
    -- 함수에서 text 타입으로 받으므로 text 타입으로 정의
    liked_type text NOT NULL,

    -- 현재 좋아요 상태: 현재 좋아요가 활성화되어 있는지 여부 (true: 좋아요, false: 좋아요 취소)
    liked boolean NOT NULL DEFAULT true,

    -- 생성 시각: 이 좋아요 기록이 처음 생성된 시각
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,

    -- 수정 시각: 이 좋아요 상태가 마지막으로 변경된 시각
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,

    -- 고유성 제약 조건: 한 사용자는 특정 아이템(liked_id, liked_type)에 대해 하나의 좋아요 기록만 가질 수 있도록 보장
    CONSTRAINT tbl_like_user_liked_item_unique UNIQUE (user_id, liked_id, liked_type)
);

-- 테이블 및 컬럼에 대한 주석 (설명 추가)
COMMENT ON TABLE public.tbl_like IS '사용자 좋아요/취소 정보를 저장하는 테이블';
COMMENT ON COLUMN public.tbl_like.id IS '좋아요 기록의 고유 식별자 (PK)';
COMMENT ON COLUMN public.tbl_like.user_id IS '좋아요를 누른 사용자의 ID (FK, auth.users.id 참조)';
COMMENT ON COLUMN public.tbl_like.liked_id IS '좋아요 대상 아이템의 ID (예: 리뷰 ID)';
COMMENT ON COLUMN public.tbl_like.liked_type IS '좋아요 대상 아이템의 타입 (예: place_review)';
COMMENT ON COLUMN public.tbl_like.liked IS '현재 좋아요 상태 (true: 좋아요, false: 좋아요 취소됨)';
COMMENT ON COLUMN public.tbl_like.created_at IS '좋아요 기록 생성 시각 (UTC)';
COMMENT ON COLUMN public.tbl_like.updated_at IS '좋아요 상태 마지막 업데이트 시각 (UTC)';


-- 인덱스 생성: 자주 사용되는 조회 조건에 대한 성능 향상
-- toggle_like 함수에서 사용하는 조건절에 대한 복합 인덱스
CREATE INDEX idx_tbl_like_user_liked_item ON public.tbl_like (user_id, liked_id, liked_type);

-- 사용자가 좋아요한 목록 조회 시 유용할 수 있는 인덱스
CREATE INDEX idx_tbl_like_user_id ON public.tbl_like (user_id);


-- RLS(행 수준 보안) 활성화: 보안 강화를 위해 필요
ALTER TABLE public.tbl_like ENABLE ROW LEVEL SECURITY;





CREATE POLICY "익명 사용자 읽기 허용" 
ON tbl_like 
FOR SELECT 
TO anon
USING (true);

-- RLS 정책 예시 (사용자 본인의 좋아요 기록만 조작/조회 가능)
-- 주의: 실제 필요한 정책에 맞게 수정해야 합니다.

-- 사용자가 자신의 좋아요 기록을 조회할 수 있도록 허용
CREATE POLICY "Allow user to view their own likes"
ON public.tbl_like FOR SELECT
USING (auth.uid() = user_id);

-- 사용자가 자신의 좋아요 기록을 삽입할 수 있도록 허용
CREATE POLICY "Allow user to insert their own likes"
ON public.tbl_like FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- 사용자가 자신의 좋아요 기록의 'liked' 상태 및 'updated_at'을 업데이트할 수 있도록 허용
CREATE POLICY "Allow user to update their own like status"
ON public.tbl_like FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- (참고) 좋아요 기록 삭제 정책: 일반적으로 'liked' 플래그를 사용하므로 삭제는 제한할 수 있음
-- 필요하다면 아래와 같이 삭제 정책 추가 가능
-- CREATE POLICY "Allow user to delete their own likes"
-- ON public.tbl_like FOR DELETE
-- USING (auth.uid() = user_id);


-- tbl_like 테이블에 트리거 적용: 행이 업데이트될 때마다 updated_at 자동 갱신
CREATE TRIGGER update_tbl_like_updated_at
BEFORE UPDATE ON public.tbl_like
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
