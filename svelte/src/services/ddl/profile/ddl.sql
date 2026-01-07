-- 음식점(장소)에 대한 사용자 댓글 테이블 생성 (소프트 삭제 방식 적용)
CREATE TABLE public.tbl_comment_for_place (
    -- 기본 키: 각 댓글을 고유하게 식별
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,

    -- 사용자 ID: 댓글 작성자 (auth.users 테이블 참조)
    user_id uuid NULL REFERENCES auth.users(id) ON DELETE SET NULL, -- 사용자가 삭제되면 작성자 정보만 NULL로 변경 (소프트 삭제 시 댓글은 유지)

    -- 댓글 제목: 선택 사항
    title text NULL,

    -- 댓글 내용
    content text NOT NULL CHECK (length(content) > 0),

    -- 음식점(장소) ID: 어떤 음식점에 대한 댓글인지 식별
    -- !! 중요: tbl_place 테이블의 id 컬럼 타입과 일치시켜야 합니다. (아래는 text 가정)
    business_id text NOT NULL, -- REFERENCES public.tbl_place(id) ON DELETE CASCADE,

    -- 이미지 경로: 댓글에 첨부된 이미지 파일들의 경로 배열
    image_paths text[] NULL,

    -- 부모 댓글 ID: 대댓글인 경우 원본 댓글의 id 참조
    -- 원본 댓글이 비활성화되어도 대댓글은 남아있을 수 있음 (ON DELETE CASCADE 유지 또는 변경 고려)
    parent_comment_id uuid NULL REFERENCES public.tbl_comment_for_place(id) ON DELETE CASCADE,

    -- 댓글 레벨: 0 = 원본 댓글, 1 = 대댓글
    comment_level integer NOT NULL DEFAULT 0 CHECK (comment_level IN (0, 1)),

    -- 댓글 상태: 활성 여부 (true: 활성/표시, false: 비활성/숨김)
    is_active boolean NOT NULL DEFAULT true,

    -- 생성 시각: 댓글 작성 시각
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,

    -- 수정 시각: 댓글 내용 또는 상태 수정 시각
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,

    -- 제약 조건: 댓글 레벨과 부모 댓글 ID의 논리적 일관성 유지
    CONSTRAINT check_comment_hierarchy CHECK (
        (comment_level = 0 AND parent_comment_id IS NULL)
        OR
        (comment_level = 1 AND parent_comment_id IS NOT NULL)
    )
);

-- 테이블 및 컬럼에 대한 주석 (설명 추가)
COMMENT ON TABLE public.tbl_comment_for_place IS '음식점(장소)에 대한 사용자 댓글 정보 (소프트 삭제 방식)';
COMMENT ON COLUMN public.tbl_comment_for_place.id IS '댓글의 고유 식별자 (PK)';
COMMENT ON COLUMN public.tbl_comment_for_place.user_id IS '댓글 작성자의 ID (FK, auth.users.id 참조)';
COMMENT ON COLUMN public.tbl_comment_for_place.title IS '댓글 제목 (선택 사항)';
COMMENT ON COLUMN public.tbl_comment_for_place.content IS '댓글 본문 내용';
COMMENT ON COLUMN public.tbl_comment_for_place.business_id IS '댓글이 달린 음식점(장소)의 ID';
COMMENT ON COLUMN public.tbl_comment_for_place.image_paths IS '댓글에 첨부된 이미지 경로 배열';
COMMENT ON COLUMN public.tbl_comment_for_place.parent_comment_id IS '대댓글인 경우 부모 댓글의 ID (FK, 자기 참조)';
COMMENT ON COLUMN public.tbl_comment_for_place.comment_level IS '댓글 계층 레벨 (0: 원본, 1: 대댓글)';
COMMENT ON COLUMN public.tbl_comment_for_place.is_active IS '댓글 활성 상태 (true: 활성/표시, false: 비활성/숨김)'; -- 상태 컬럼 추가
COMMENT ON COLUMN public.tbl_comment_for_place.created_at IS '댓글 생성 시각 (UTC)';
COMMENT ON COLUMN public.tbl_comment_for_place.updated_at IS '댓글 마지막 수정 시각 (UTC)';


-- 인덱스 생성: 조회 성능 향상
-- 특정 음식점의 '활성' 댓글을 최신순으로 조회
CREATE INDEX idx_tbl_comment_place_business_active_created ON public.tbl_comment_for_place (business_id, created_at DESC) WHERE is_active = true;
-- 특정 음식점의 '활성' 원본 댓글(레벨 0)을 최신순으로 조회
CREATE INDEX idx_tbl_comment_place_business_level0_active_created ON public.tbl_comment_for_place (business_id, created_at DESC) WHERE comment_level = 0 AND is_active = true;
-- 특정 원본 댓글에 달린 '활성' 대댓글(레벨 1)을 오래된 순으로 조회
CREATE INDEX idx_tbl_comment_place_parent_active_created ON public.tbl_comment_for_place (parent_comment_id, created_at ASC) WHERE comment_level = 1 AND is_active = true;
-- 사용자가 작성한 '활성' 댓글 조회
CREATE INDEX idx_tbl_comment_place_user_active ON public.tbl_comment_for_place (user_id) WHERE is_active = true;


-- RLS(행 수준 보안) 활성화: 보안 강화를 위해 필요
ALTER TABLE public.tbl_comment_for_place ENABLE ROW LEVEL SECURITY;

-- RLS 정책 수정 (소프트 삭제 반영)

-- '활성' 상태인 댓글만 읽을 수 있도록 허용 (UI 노출 기준)
DROP POLICY IF EXISTS "Allow public read access" ON public.tbl_comment_for_place; -- 기존 정책 삭제
CREATE POLICY "Allow public read access to active comments"
ON public.tbl_comment_for_place FOR SELECT
USING (is_active = true); -- is_active가 true인 것만 조회

-- 로그인한 사용자는 자신의 댓글을 삽입할 수 있도록 허용 (기본값 is_active=true)
DROP POLICY IF EXISTS "Allow authenticated users to insert their own comments" ON public.tbl_comment_for_place;
CREATE POLICY "Allow authenticated users to insert their own comments"
ON public.tbl_comment_for_place FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- 사용자는 자신의 '활성' 댓글을 수정할 수 있도록 허용 (예: content, image_paths)
DROP POLICY IF EXISTS "Allow users to update their own comments" ON public.tbl_comment_for_place;
CREATE POLICY "Allow users to update their own active comments"
ON public.tbl_comment_for_place FOR UPDATE
USING (auth.uid() = user_id AND is_active = true) -- 활성 상태일 때만 수정 가능
WITH CHECK (auth.uid() = user_id);
-- 참고: is_active 상태 변경은 아래 별도 정책으로 관리

-- 사용자는 자신의 댓글을 비활성화(소프트 삭제)할 수 있도록 허용 (is_active를 false로 업데이트)
CREATE POLICY "Allow users to deactivate their own comments"
ON public.tbl_comment_for_place FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id AND is_active = false); -- is_active를 false로 변경하는 것만 허용

--tbl_comment_for_place 테이블에 트리거 적용: 행이 업데이트될 때마다 updated_at 자동 갱신
CREATE TRIGGER update_tbl_comment_place_updated_at
BEFORE UPDATE ON public.tbl_comment_for_place
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

