-- =====================================================
-- 087_add_drinking_info_to_reviews.sql
-- 사용자 리뷰에 음주 여부 및 병 수 정보 추가
-- 
-- 실행 방법:
--   psql "postgresql://postgres.xyqpggpilgcdsawuvpzn:ZNDqDunnaydr0aFQ@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres" -f docs/sql/087_add_drinking_info_to_reviews.sql
-- =====================================================

-- 1. 테이블 컬럼 추가
ALTER TABLE public.tbl_place_user_review ADD COLUMN IF NOT EXISTS is_drinking BOOLEAN DEFAULT FALSE;
ALTER TABLE public.tbl_place_user_review ADD COLUMN IF NOT EXISTS drinking_bottles NUMERIC DEFAULT 0;

-- 2. 사용자 리뷰 작성/수정 함수 업데이트
-- 기존 함수 삭제 (매개변수와 반환 타입 변경)
DROP FUNCTION IF EXISTS public.v1_upsert_place_user_review(character varying, text, numeric, boolean, boolean, uuid, jsonb, character varying, character varying, character varying[], boolean);
DROP FUNCTION IF EXISTS public.v1_upsert_place_user_review(character varying, text, numeric, boolean, boolean, uuid, jsonb, character varying, character varying, character varying[], boolean, varchar[], uuid[]);

CREATE OR REPLACE FUNCTION public.v1_upsert_place_user_review(
    p_place_id character varying, 
    p_review_content text, 
    p_score numeric DEFAULT NULL::numeric, 
    p_is_private boolean DEFAULT false, 
    p_is_active boolean DEFAULT true, 
    p_review_id uuid DEFAULT NULL::uuid, 
    p_media_urls jsonb DEFAULT NULL::jsonb, 
    p_gender_code character varying DEFAULT NULL::character varying, 
    p_age_group_code character varying DEFAULT NULL::character varying, 
    p_tag_codes character varying[] DEFAULT NULL::character varying[], 
    p_profile_gender_and_age_by_pass boolean DEFAULT false,
    p_image_paths varchar[] DEFAULT NULL::varchar[],
    p_deleted_image_ids uuid[] DEFAULT NULL::uuid[],
    p_created_at timestamp with time zone DEFAULT NULL::timestamp with time zone,
    p_is_drinking boolean DEFAULT false,
    p_drinking_bottles numeric DEFAULT 0
)
 RETURNS TABLE(
    id uuid, 
    user_id uuid, 
    place_id character varying, 
    review_content text, 
    score numeric, 
    media_urls jsonb, 
    gender_code character varying, 
    age_group_code character varying, 
    is_private boolean, 
    is_active boolean, 
    created_at timestamp with time zone, 
    updated_at timestamp with time zone, 
    is_my_review boolean, 
    tags jsonb, 
    user_profile jsonb,
    images jsonb,
    is_drinking boolean, 
    drinking_bottles numeric
)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
#variable_conflict use_column
DECLARE
    caller_user_id uuid := auth.uid();
    v_id uuid;
    v_has_images boolean := false;
BEGIN
    IF caller_user_id IS NULL THEN RAISE EXCEPTION '인증된 사용자만 리뷰를 작성/수정할 수 있습니다.'; END IF;

    -- 1. 리뷰 본문 저장/수정
    IF p_review_id IS NULL THEN
        INSERT INTO tbl_place_user_review (user_id, place_id, review_content, score, is_private, is_active, media_urls, gender_code, age_group_code, is_drinking, drinking_bottles, created_at)
        VALUES (caller_user_id, p_place_id, p_review_content, p_score, p_is_private, p_is_active, p_media_urls, p_gender_code, p_age_group_code, p_is_drinking, p_drinking_bottles, COALESCE(p_created_at, now())) 
        RETURNING tbl_place_user_review.id INTO v_id;
    ELSE
        UPDATE tbl_place_user_review SET 
            review_content = COALESCE(p_review_content, tbl_place_user_review.review_content), 
            score = COALESCE(p_score, tbl_place_user_review.score), 
            is_private = COALESCE(p_is_private, tbl_place_user_review.is_private), 
            is_active = COALESCE(p_is_active, tbl_place_user_review.is_active), 
            media_urls = COALESCE(p_media_urls, tbl_place_user_review.media_urls), 
            gender_code = COALESCE(p_gender_code, tbl_place_user_review.gender_code), 
            age_group_code = COALESCE(p_age_group_code, tbl_place_user_review.age_group_code), 
            is_drinking = COALESCE(p_is_drinking, tbl_place_user_review.is_drinking),
            drinking_bottles = COALESCE(p_drinking_bottles, tbl_place_user_review.drinking_bottles),
            updated_at = now()
        WHERE tbl_place_user_review.id = p_review_id AND tbl_place_user_review.user_id = caller_user_id
        RETURNING tbl_place_user_review.id INTO v_id;
    END IF;

    IF v_id IS NOT NULL THEN
        -- 2. 태그 매핑 처리
        DELETE FROM tbl_place_user_review_tag_map WHERE review_id = v_id;
        IF p_tag_codes IS NOT NULL THEN 
            INSERT INTO tbl_place_user_review_tag_map(review_id, tag_code) 
            SELECT v_id, UNNEST(p_tag_codes); 
        END IF;

        -- 3. 이미지 삭제 처리 (Soft Delete)
        IF p_deleted_image_ids IS NOT NULL AND array_length(p_deleted_image_ids, 1) > 0 THEN
            UPDATE tbl_review_images 
            SET is_deleted = true, updated_at = now()
            WHERE id = ANY(p_deleted_image_ids) AND user_id = caller_user_id;
        END IF;

        -- 4. 새 이미지 추가
        IF p_image_paths IS NOT NULL AND array_length(p_image_paths, 1) > 0 THEN
            INSERT INTO tbl_review_images (review_id, place_id, image_path, user_id)
            SELECT v_id, p_place_id, UNNEST(p_image_paths), caller_user_id;
        END IF;

        -- 5. has_images 플래그 업데이트
        SELECT EXISTS (
            SELECT 1 FROM tbl_review_images 
            WHERE review_id = v_id AND is_deleted = false
        ) INTO v_has_images;

        UPDATE tbl_place_user_review SET has_images = v_has_images WHERE id = v_id;
    END IF;

    -- 6. 사용자 프로필 업데이트
    IF NOT p_profile_gender_and_age_by_pass THEN
        UPDATE tbl_user_profile SET gender_code = p_gender_code, age_group_code = p_age_group_code WHERE auth_user_id = caller_user_id;
    END IF;

    RETURN QUERY
    SELECT 
        r.id, r.user_id, r.place_id, r.review_content, r.score, r.media_urls, r.gender_code, r.age_group_code, r.is_private, r.is_active, r.created_at, r.updated_at, (r.user_id = caller_user_id),
        (SELECT COALESCE(jsonb_agg(jsonb_build_object('code', m.tag_code, 'label', t.tag_label, 'is_positive', t.is_positive, 'group', t.tag_group)), '[]'::jsonb) FROM tbl_place_user_review_tag_map m LEFT JOIN tbl_place_review_tag_master t ON m.tag_code = t.tag_code WHERE m.review_id = r.id),
        jsonb_build_object('nickname', COALESCE(u.nickname, ''), 'profile_image_url', u.profile_image_url, 'gender_code', u.gender_code, 'age_group_code', u.age_group_code),
        (SELECT COALESCE(jsonb_agg(jsonb_build_object('id', ri.id, 'image_path', ri.image_path)), '[]'::jsonb) FROM tbl_review_images ri WHERE ri.review_id = r.id AND ri.is_deleted = false),
        r.is_drinking, r.drinking_bottles
    FROM tbl_place_user_review r 
    LEFT JOIN tbl_user_profile u ON r.user_id = u.auth_user_id 
    WHERE r.id = v_id;
END;
$function$;

-- 3. 개별 사용자 리뷰 조회 함수 업데이트
DROP FUNCTION IF EXISTS public.v1_get_place_user_review(uuid);

CREATE OR REPLACE FUNCTION public.v1_get_place_user_review(p_review_id uuid)
 RETURNS TABLE(
    id uuid, 
    user_id uuid, 
    place_id character varying, 
    review_content text, 
    score numeric, 
    media_urls jsonb, 
    gender_code character varying, 
    age_group_code character varying, 
    is_private boolean, 
    is_active boolean, 
    created_at timestamp with time zone, 
    updated_at timestamp with time zone, 
    is_my_review boolean, 
    tags jsonb, 
    user_profile jsonb,
    images jsonb,
    is_drinking boolean, 
    drinking_bottles numeric
)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
#variable_conflict use_column
BEGIN
    RETURN QUERY
    SELECT 
        r.id, r.user_id, r.place_id, r.review_content, r.score, r.media_urls, r.gender_code, r.age_group_code, r.is_private, r.is_active, r.created_at, r.updated_at, (r.user_id = auth.uid()),
        (SELECT COALESCE(jsonb_agg(jsonb_build_object('code', m.tag_code, 'label', t.tag_label, 'is_positive', t.is_positive, 'group', t.tag_group)), '[]'::jsonb) FROM tbl_place_user_review_tag_map m LEFT JOIN tbl_place_review_tag_master t ON m.tag_code = t.tag_code WHERE m.review_id = r.id),
        jsonb_build_object('nickname', COALESCE(u.nickname, ''), 'profile_image_url', u.profile_image_url, 'gender_code', u.gender_code, 'age_group_code', u.age_group_code),
        (SELECT COALESCE(jsonb_agg(jsonb_build_object('id', ri.id, 'image_path', ri.image_path)), '[]'::jsonb) FROM tbl_review_images ri WHERE ri.review_id = r.id AND ri.is_deleted = false),
        r.is_drinking, r.drinking_bottles
    FROM tbl_place_user_review r 
    LEFT JOIN tbl_user_profile u ON r.user_id = u.auth_user_id 
    WHERE r.id = p_review_id AND r.is_active = TRUE AND (r.is_private = FALSE OR r.user_id = auth.uid());
END;
$function$;

-- 4. 장소별 사용자 리뷰 목록 조회 함수 업데이트
DROP FUNCTION IF EXISTS public.v1_list_place_user_review(character varying, integer, integer);

CREATE OR REPLACE FUNCTION public.v1_list_place_user_review(p_place_id character varying, p_limit integer DEFAULT 20, p_offset integer DEFAULT 0)
 RETURNS TABLE(
    id uuid, 
    user_id uuid, 
    place_id character varying, 
    review_content text, 
    score numeric, 
    media_urls jsonb, 
    gender_code character varying, 
    age_group_code character varying, 
    is_private boolean, 
    is_active boolean, 
    created_at timestamp with time zone, 
    updated_at timestamp with time zone, 
    is_my_review boolean, 
    tags jsonb, 
    user_profile jsonb,
    images jsonb,
    is_drinking boolean, 
    drinking_bottles numeric
)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
#variable_conflict use_column
BEGIN
    RETURN QUERY
    SELECT 
        r.id, r.user_id, r.place_id, r.review_content, r.score, r.media_urls, r.gender_code, r.age_group_code, r.is_private, r.is_active, r.created_at, r.updated_at, (r.user_id = auth.uid()),
        (SELECT COALESCE(jsonb_agg(jsonb_build_object('code', m.tag_code, 'label', t.tag_label, 'is_positive', t.is_positive, 'group', t.tag_group)), '[]'::jsonb) FROM tbl_place_user_review_tag_map m LEFT JOIN tbl_place_review_tag_master t ON m.tag_code = t.tag_code WHERE m.review_id = r.id),
        jsonb_build_object('nickname', COALESCE(u.nickname, ''), 'profile_image_url', u.profile_image_url, 'gender_code', u.gender_code, 'age_group_code', u.age_group_code),
        (SELECT COALESCE(jsonb_agg(jsonb_build_object('id', ri.id, 'image_path', ri.image_path)), '[]'::jsonb) FROM tbl_review_images ri WHERE ri.review_id = r.id AND ri.is_deleted = false),
        r.is_drinking, r.drinking_bottles
    FROM tbl_place_user_review r 
    LEFT JOIN tbl_user_profile u ON r.user_id = u.auth_user_id 
    WHERE r.place_id = p_place_id 
      AND r.is_active = TRUE
      AND (r.is_private = FALSE OR r.user_id = auth.uid())
    ORDER BY r.created_at DESC LIMIT p_limit OFFSET p_offset;
END;
$function$;
