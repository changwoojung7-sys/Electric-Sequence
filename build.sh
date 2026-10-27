#!/bin/bash
# Cloudflare Pages 빌드: 사이트에 필요한 파일만 dist/ 로 복사 (개발 문서·로컬 실행 파일 제외)
set -e
rm -rf dist
mkdir -p dist
cp -r index.html intro.html css js assets dist/
echo "dist 준비 완료: $(find dist -type f | wc -l)개 파일"
