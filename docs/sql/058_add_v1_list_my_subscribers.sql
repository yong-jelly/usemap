-- =====================================================
-- 058_add_v1_list_my_subscribers.sql
-- 내가 소유한 폴더를 구독하고 있는 사용자 목록을 조회하는 함수 추가
-- 
-- 실행 방법:
--   psql "postgresql://postgres.xyqpggpilgcdsawuvpzn:ZNDqDunnaydr0aFQ@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres" -f docs/sql/058_add_v1_list_my_subscribers.sql
-- =====================================================

DROP FUNCTION IF EXISTS public.v1_list_my_subscribers();

CREATE OR REPLACE FUNCTION public.v1_list_my_subscribers()
RETURNS TABLE (
    subscriber_id UUID,
    nickname VARCHAR,
    profile_image_url TEXT,
    folder_names TEXT[],
    total_folders BIGINT,
    created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
    RETURN QUERY
    WITH my_folders AS (
        -- 내가 소유한 폴더 (숨겨지지 않은 것)
        SELECT id, title
        FROM public.tbl_folder
        WHERE owner_id = auth.uid() AND is_hidden = FALSE
    ),
    subscribers_data AS (
        -- 내 폴더를 구독 중인 사용자들
        SELECT 
            fs.user_id,
            ARRAY_AGG(mf.title ORDER BY fs.created_at ASC) as folder_list,
            COUNT(*) as folder_count,
            MAX(fs.created_at) as last_subscribed_at
        FROM public.tbl_folder_subscribed fs
        JOIN my_folders mf ON fs.folder_id = mf.id
        WHERE fs.deleted_at IS NULL
        GROUP BY fs.user_id
    )
    SELECT 
        sd.user_id as subscriber_id,
        up.nickname::VARCHAR,
        up.profile_image_url,
        sd.folder_list::TEXT[] as folder_names,
        sd.folder_count as total_folders,
        sd.last_subscribed_at::TIMESTAMPTZ as created_at
    FROM subscribers_data sd
    JOIN public.tbl_user_profile up ON sd.user_id = up.auth_user_id
    ORDER BY sd.last_subscribed_at DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.v1_list_my_subscribers() TO authenticated;
GRANT EXECUTE ON FUNCTION public.v1_list_my_subscribers() TO service_role;

COMMENT ON FUNCTION public.v1_list_my_subscribers() IS '현재 사용자가 소유한 폴더를 구독하고 있는 사용자 목록과 구독 중인 폴더 정보 조회';
