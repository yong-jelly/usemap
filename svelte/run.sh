#!/bin/bash

# 기본 환경은 development
ENV="production"

# 인자가 "local"이면 로컬 환경 사용
if [ "$1" = "local" ]; then
  ENV="development"
fi

# 환경 변수 파일 로드 및 개발 서버 실행
bun --watch run dev --host 0.0.0.0 --mode $ENV


# pm2 start  "bun --watch run dev --host 0.0.0.0 --port 8080 --mode "production"" --name "svelteui"