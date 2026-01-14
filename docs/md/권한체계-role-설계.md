# 권한 체계 및 관리자(Role) 설계 가이드

이 프로젝트는 사용자의 역할에 따라 접근 권한 및 기능을 제어하는 권한 체계를 갖추고 있습니다.

## 1. 사용자 역할 (Role) 정의

모든 사용자는 `tbl_user_profile` 테이블의 `role` 컬럼을 통해 역할을 부여받습니다.

| 역할 | 코드 | 설명 |
| :--- | :--- | :--- |
| 일반 사용자 | `user` | 기본값. 일반적인 서비스 이용 권한만 가짐. |
| 관리자 | `admin` | 시스템 운영 및 데이터 관리 권한을 가짐. (삭제, 수정 등) |

## 2. 권한 검증 방식

### 2.1 데이터베이스 (RPC/PostgreSQL)
- 민감한 작업(삭제 등)을 수행하는 RPC 함수에서는 `auth.uid()`를 통해 호출자를 확인하고, `tbl_user_profile`에서 해당 사용자의 `role`을 조회하여 검증합니다.
- `SECURITY DEFINER` 설정을 통해 함수가 생성자의 권한으로 실행되도록 하며, 함수 내부에서 명시적인 권한 체크 로직을 포함합니다.

```sql
-- 예시: 관리자 권한 체크
SELECT role INTO v_caller_role FROM public.tbl_user_profile WHERE auth_user_id = v_caller_id;
IF v_caller_role IS NULL OR lower(v_caller_role) != 'admin' THEN
    RETURN json_build_object('success', false, 'message', '관리자 권한이 필요합니다.');
END IF;
```

### 2.2 애플리케이션 (TypeScript/React)
- `src/entities/user/lib/auth.ts`의 `isAdmin` 유틸리티 함수를 사용하여 UI 노출 여부를 제어합니다.
- 전역 상태 관리(`useUserStore`)를 통해 현재 로그인한 사용자의 프로필 정보를 참조합니다.

```typescript
import { isAdmin } from "@/entities/user";

// ...
{isAdmin(currentUser) && (
  <button onClick={handleDelete}>삭제</button>
)}
```

## 3. 주요 관리자 기능

### 3.1 장소 및 피처 삭제
- 관리자는 장소 상세 모달 및 네이버 플레이스 폴더 상세 페이지에서 삭제 버튼을 통해 데이터를 영구적으로 삭제할 수 있습니다.
- 삭제 시 `v1_delete_place` 또는 `v1_delete_naver_folder` RPC가 호출됩니다.

## 4. 액션 히스토리 (Audit Log)
- 모든 중요 액션(삭제 등)은 `tbl_action_history` 테이블에 기록됩니다.
- 기록 항목: 액션 수행자, 액션 종류, 대상 테이블명, 대상 ID, 메타데이터(이름 등).

```sql
INSERT INTO public.tbl_action_history (action_user_id, action, source_name, source_id, metadata)
VALUES (v_caller_id, 'DELETED', 'tbl_place', p_place_id, jsonb_build_object('name', v_place_name));
```

## 5. 초기 관리자 설정
- 시스템 초기 관리자는 데이터베이스 마이그레이션 스크립트를 통해 설정됩니다.
- 현재 설정된 관리자: `skillove@gmail.com`
