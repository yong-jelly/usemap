-- =====================================================
-- 구독 상태 동기화 검증 쿼리
-- =====================================================

-- 1. 현재 사용자의 구독 목록 확인
SELECT 
    subscription_type,
    feature_id,
    title,
    created_at
FROM v1_list_my_subscriptions()
ORDER BY created_at DESC;

-- 2. 특정 피쳐의 구독 상태 확인 (예: community_region, feature_id='서울')
SELECT 
    subscription_type,
    feature_id,
    title
FROM v1_list_my_subscriptions()
WHERE subscription_type = 'community_region' 
  AND feature_id = '서울';

-- 3. tbl_feature_subscription 테이블 직접 확인
SELECT 
    feature_type,
    feature_id,
    user_id,
    created_at,
    deleted_at
FROM tbl_feature_subscription
WHERE user_id = auth.uid()
ORDER BY created_at DESC;

-- 4. 구독 토글 테스트 (실행 전후로 위 쿼리들을 비교)
-- SELECT v1_toggle_feature_subscription('community_region', '서울');

-- 5. 구독 상태 확인 (v1_list_my_subscriptions와 직접 쿼리 비교)
SELECT 
    'v1_list_my_subscriptions' as source,
    subscription_type,
    feature_id
FROM v1_list_my_subscriptions()
WHERE subscription_type = 'community_region' 
  AND feature_id = '서울'

UNION ALL

SELECT 
    'direct_query' as source,
    feature_type::VARCHAR as subscription_type,
    feature_id
FROM tbl_feature_subscription
WHERE user_id = auth.uid()
  AND feature_type = 'community_region'
  AND feature_id = '서울'
  AND deleted_at IS NULL;
