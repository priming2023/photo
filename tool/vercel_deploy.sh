#!/usr/bin/env bash
# 로컬 .env 기반 Vercel Production 배포
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

if [[ ! -f .env ]]; then
  echo "::error::.env 파일이 필요합니다 (VITE_FAL_KEY, VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY)" >&2
  exit 1
fi

FAL=$(grep '^VITE_FAL_KEY=' .env | cut -d= -f2-)
SUPA_URL=$(grep '^VITE_SUPABASE_URL=' .env | cut -d= -f2-)
SUPA_KEY=$(grep '^VITE_SUPABASE_ANON_KEY=' .env | cut -d= -f2-)

for VAR_VAL in "VITE_FAL_KEY=$FAL" "VITE_SUPABASE_URL=$SUPA_URL" "VITE_SUPABASE_ANON_KEY=$SUPA_KEY"; do
  NAME="${VAR_VAL%%=*}"
  VALUE="${VAR_VAL#*=}"
  npx vercel@latest env rm "$NAME" production -y 2>/dev/null || true
  npx vercel@latest env add "$NAME" production --value "$VALUE" --yes
done

npx vercel@latest --prod --yes
echo "[done] https://phto-orcin.vercel.app  (또는 Vercel 대시보드의 Production URL)"
