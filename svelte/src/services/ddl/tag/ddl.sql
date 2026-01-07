-- 음식점 평가 태그 마스터 테이블
CREATE TABLE public.tbl_tag_master_for_place (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
    tag_group VARCHAR(30) NOT NULL CHECK (tag_group IN ('taste_menu', 'price_value', 'atmosphere_facility', 'service', 'situation_purpose', 'info_etc')), -- 영어 그룹명 사용 (ENUM 대신 CHECK 제약조건 사용)
    tag_group_ko VARCHAR(100) NOT NULL, -- 태그 그룹 한글명 (UI 표시용)
    tag_name VARCHAR(100) NOT NULL UNIQUE, -- 실제 표시되는 태그명 (고유해야 함)
    tag_name_slug VARCHAR(100) NOT NULL UNIQUE, -- 태그명 슬러그 (URL 등에서 사용, 고유해야 함)
    tag_order integer DEFAULT 0 NOT NULL, -- tag 정렬 순서용
    tag_desc VARCHAR(200), -- 태그에 대한 상세 설명
    category VARCHAR(20) NOT NULL CHECK (category IN ('positive', 'neutral', 'negative', 'hateful')), -- 카테고리 (ENUM 대신 CHECK 제약조건 사용)
    topic VARCHAR(50) NOT NULL, -- 태그의 주제 분류 (tag_group과 유사하거나 더 세분화될 수 있음)
    level INTEGER DEFAULT 1 NOT NULL CHECK (level IN (0, 1, 2)), -- 태그의 중요도/가중치 (0: 낮음, 1: 보통, 2: 높음)
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    is_active BOOLEAN DEFAULT true NOT NULL
);

-- 인덱스 추가 (필요에 따라 추가)
CREATE INDEX idx_tag_master_tag_group ON public.tbl_tag_master_for_place (tag_group);
CREATE INDEX idx_tag_master_category ON public.tbl_tag_master_for_place (category);
CREATE INDEX idx_tag_master_is_active ON public.tbl_tag_master_for_place (is_active);

-- 태그 변경 이력 테이블
CREATE TABLE public.tbl_tag_history (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
    tag_id uuid NOT NULL, -- 변경된 태그의 ID (tbl_tag_master_for_place 참조, 외래 키 제약 조건은 걸지 않음 - 마스터에서 삭제되어도 이력은 남아야 함)
    user_id uuid NULL, -- 변경 작업을 수행한 사용자 ID (Supabase auth.uid() 등으로 설정)
    action_type VARCHAR(20) NOT NULL CHECK (action_type IN ('CREATE', 'UPDATE', 'DELETE')), -- 태그 변경 작업 유형
    change_details jsonb NULL, -- 변경 내용 (선택 사항, UPDATE 시 이전/이후 값 저장 등)
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 인덱스 추가
CREATE INDEX idx_tag_history_tag_id ON public.tbl_tag_history (tag_id);
CREATE INDEX idx_tag_history_user_id ON public.tbl_tag_history (user_id);
CREATE INDEX idx_tag_history_action_type ON public.tbl_tag_history (action_type);

-- 장소(음식점)에 사용자가 태그를 연결하는 테이블
CREATE TABLE public.tbl_place_tag (
    -- 기본 키: 각 태그 연결 정보를 고유하게 식별
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,

    -- 사용자 ID: 태그를 추가한 사용자 (auth.users 테이블 참조)
    -- 사용자가 삭제되면 해당 사용자가 추가한 태그 정보도 함께 삭제 (ON DELETE CASCADE)
    user_id uuid NOT NULL REFERENCES auth.users(id),-- ON DELETE CASCADE,

    -- 음식점(장소) ID: 태그가 연결될 음식점의 ID
    -- !! 중요: 참조하는 테이블(예: mv_place_summary 또는 tbl_place)의 id 컬럼 타입과 일치해야 함 (text로 가정)
    business_id text NOT NULL, -- REFERENCES public.mv_place_summary(id) ON DELETE CASCADE (필요시 주석 해제 및 테이블명 확인)

    -- 태그 ID: 연결될 태그의 ID (tbl_tag_master_for_place 테이블 참조)
    -- 마스터 태그가 삭제되면 해당 태그를 사용한 연결 정보도 함께 삭제 (ON DELETE CASCADE)
    tag_id uuid NOT NULL REFERENCES public.tbl_tag_master_for_place(id),-- ON DELETE CASCADE,

    -- 추가 데이터: 특정 태그(예: 유튜브 관련 태그)에 필요한 추가 정보 저장 (JSONB 형식)
    -- 예: {'youtube_url': 'https://...', 'notes': '...'}
    additional_data jsonb NULL,

    -- 생성 시각: 레코드 생성 시각 (UTC 기준)
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,

    -- 수정 시각: 레코드 수정 시각 (UTC 기준, 트리거로 자동 업데이트)
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,

    -- 제약 조건: 사용자는 특정 음식점에 대해 동일한 태그를 중복해서 추가할 수 없음
    CONSTRAINT unique_user_business_tag UNIQUE (user_id, business_id, tag_id)
);

-- 인덱스 추가: 자주 조회될 컬럼에 인덱스를 생성하여 성능 향상
CREATE INDEX idx_place_tag_user_id ON public.tbl_place_tag (user_id);
CREATE INDEX idx_place_tag_business_id ON public.tbl_place_tag (business_id);
CREATE INDEX idx_place_tag_tag_id ON public.tbl_place_tag (tag_id);
-- 복합 인덱스 (UNIQUE 제약 조건으로 인해 자동으로 생성될 수 있으나, 명시적으로 생성 가능)
-- CREATE INDEX idx_place_tag_user_business_tag ON public.tbl_place_tag (user_id, business_id, tag_id);

-- tbl_place_tag 테이블에 대한 UPDATE 트리거 생성
CREATE TRIGGER set_place_tag_timestamp
BEFORE UPDATE ON public.tbl_place_tag
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- 테이블 및 컬럼 설명 추가 (선택 사항)
COMMENT ON TABLE public.tbl_place_tag IS '사용자가 특정 장소(음식점)에 태그를 연결하고 추가 정보를 관리하는 테이블';
COMMENT ON COLUMN public.tbl_place_tag.id IS '태그 연결 고유 ID';
COMMENT ON COLUMN public.tbl_place_tag.user_id IS '태그를 추가한 사용자 ID (auth.users 참조)';
COMMENT ON COLUMN public.tbl_place_tag.business_id IS '태그가 연결된 장소(음식점) ID';
COMMENT ON COLUMN public.tbl_place_tag.tag_id IS '연결된 태그 ID (tbl_tag_master_for_place 참조)';
COMMENT ON COLUMN public.tbl_place_tag.additional_data IS '특정 태그에 필요한 추가 정보 (JSONB)';
COMMENT ON COLUMN public.tbl_place_tag.created_at IS '레코드 생성 시각 (UTC)';
COMMENT ON COLUMN public.tbl_place_tag.updated_at IS '레코드 마지막 수정 시각 (UTC)';
COMMENT ON CONSTRAINT unique_user_business_tag ON public.tbl_place_tag IS '사용자별, 장소별 태그 중복 추가 방지';
