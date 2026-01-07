-- =====================================================
-- 002_create_common_functions.sql
-- 공통적으로 사용되는 트리거 함수 및 유틸리티 함수들을 정의합니다.
-- =====================================================

-- 1. updated_at 컬럼 자동 업데이트 함수
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
   NEW.updated_at = timezone('utc'::text, now());
   RETURN NEW;
END;
$function$;

COMMENT ON FUNCTION public.update_updated_at_column() IS 'updated_at 컬럼을 현재 시각으로 자동 업데이트하는 트리거 함수';

-- 2. 신규 사용자 가입 시 프로필 자동 생성 함수
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  base_nickname TEXT;
  final_nickname TEXT;
  random_suffix TEXT;
BEGIN
  -- 이메일에서 @ 앞 부분을 기본 닉네임으로 사용하거나, 없다면 'user' 사용
  base_nickname := split_part(NEW.email, '@', 1);
  IF base_nickname = '' OR base_nickname IS NULL THEN
    base_nickname := 'user';
  END IF;
  -- 기본 닉네임 길이 제한
  base_nickname := left(base_nickname, 20);

  -- 랜덤 숫자 4자리 추가 (혹시 모를 초기 중복 방지 및 식별 용이)
  random_suffix := floor(random() * 9000 + 1000)::text;
  final_nickname := base_nickname || '_' || random_suffix;

  -- tbl_user_profile에 새 레코드 삽입
  INSERT INTO public.tbl_user_profile (auth_user_id, nickname)
  VALUES (NEW.id, final_nickname);
  RETURN NEW;
END;
$function$;

COMMENT ON FUNCTION public.handle_new_user() IS 'Auth.users에 신규 가입 시 tbl_user_profile에 기본 프로필을 자동 생성하는 트리거 함수';
