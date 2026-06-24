#!/usr/bin/env bash
# 로컬 .env 기반 Vercel Production 배포
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

if [[ ! -f .env ]]; then
  echo "::error::.env 파일이 필요합니다 (VITE_FAL_KEY, VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY)" >&2
  exit 1
fi

read_env() {
  grep "^$1=" .env | cut -d= -f2- || true
}

FAL=$(read_env VITE_FAL_KEY)
SUPA_URL=$(read_env VITE_SUPABASE_URL)
SUPA_KEY=$(read_env VITE_SUPABASE_ANON_KEY)
APP_URL=$(read_env VITE_PUBLIC_APP_URL)
STORE_NAME=$(read_env VITE_STORE_NAME)
STORE_BRANCH=$(read_env VITE_STORE_BRANCH)
STORE_ADDRESS=$(read_env VITE_STORE_ADDRESS)
SENTRY=$(read_env VITE_SENTRY_DSN)

APP_URL=${APP_URL:-https://phto-orcin.vercel.app}

VARS=(
  "VITE_FAL_KEY=$FAL"
  "VITE_SUPABASE_URL=$SUPA_URL"
  "VITE_SUPABASE_ANON_KEY=$SUPA_KEY"
  "VITE_PUBLIC_APP_URL=$APP_URL"
)

[[ -n "$STORE_NAME" ]] && VARS+=("VITE_STORE_NAME=$STORE_NAME")
[[ -n "$STORE_BRANCH" ]] && VARS+=("VITE_STORE_BRANCH=$STORE_BRANCH")
[[ -n "$STORE_ADDRESS" ]] && VARS+=("VITE_STORE_ADDRESS=$STORE_ADDRESS")
[[ -n "$SENTRY" ]] && VARS+=("VITE_SENTRY_DSN=$SENTRY")

for VAR_VAL in "${VARS[@]}"; do
  NAME="${VAR_VAL%%=*}"
  VALUE="${VAR_VAL#*=}"
  npx vercel@latest env rm "$NAME" production -y 2>/dev/null || true
  npx vercel@latest env add "$NAME" production --value "$VALUE" --yes
done

npx vercel@latest --prod --yes
echo "[done] https://phto-orcin.vercel.app  (또는 Vercel 대시보드의 Production URL)"
