#!/usr/bin/env bash
# GitHub Actions 자동 배포용 Vercel 토큰 등록 (최초 1회)
set -euo pipefail

if [[ -z "${1:-}" ]]; then
  echo "사용법: bash tool/setup_github_secrets.sh <VERCEL_TOKEN>"
  echo ""
  echo "토큰 발급: https://vercel.com/account/tokens"
  echo "  → Create Token → 이름: github-actions-photo → Full Account"
  exit 1
fi

gh secret set VERCEL_TOKEN -R priming2023/photo -b "$1"
gh secret set VERCEL_ORG_ID -R priming2023/photo -b "team_FAMw3Ek1V7wJAmCynaNWZ9IZ"
gh secret set VERCEL_PROJECT_ID -R priming2023/photo -b "prj_mKyghd1RblpC9BEVJA8SPHRHd5IQ"

echo ""
echo "✓ GitHub Secrets 등록 완료"
gh secret list -R priming2023/photo
