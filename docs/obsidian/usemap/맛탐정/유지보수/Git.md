생성일: 2026-03-05

# Git 브랜치 워크플로우

## 1. 브랜치 구조

```text
main (배포/프로덕션)
  |
  +-- dev (개발)
```

- `main`: 배포용 안정 브랜치
- `dev`: 일상 개발 브랜치

## 2. dev → main 머지 및 배포

개발 완료 후 main에 반영할 때.

```bash
git checkout main
git merge dev
git push origin main
```

한 줄 실행:

```bash
git checkout main && git merge dev && git push origin main
```

이후 dev로 복귀:

```bash
git checkout dev
```

## 3. main → dev 동기화

main에 새 커밋이 생겼을 때 dev를 최신으로 맞출 때.

```bash
git checkout dev
git merge main
```

한 줄 실행:

```bash
git checkout dev && git merge main
```

## 4. 흐름 요약

```text
[개발] dev에서 작업 → 커밋 → push
         ↓
[배포] main으로 체크아웃 → dev 머지 → push
         ↓
[동기화] dev로 체크아웃 → main 머지 (선택)
```

- 배포 후 dev에서 계속 작업할 경우, main을 dev에 머지하여 동기화 권장함.
