FROM nginx:alpine

# nginx 설정 파일 복사
COPY nginx.conf /etc/nginx/conf.d/default.conf

# 빌드된 정적 파일들을 nginx의 서빙 디렉토리로 복사
COPY dist /usr/share/nginx/html
# COPY node_modules /usr/share/nginx/html/node_modules

# 80 포트 노출
EXPOSE 80

# nginx 실행
CMD ["nginx", "-g", "daemon off;"] 