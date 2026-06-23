-- 기존 photo_sessions 테이블에 "현재의 나" 이미지 URL 컬럼 추가
-- Supabase Dashboard → SQL Editor 에서 1회 실행

ALTER TABLE photo_sessions
ADD COLUMN IF NOT EXISTS original_url TEXT;
