-- 월드킹 포토부스: 사진 세션 테이블 (QR 공유용)
-- Supabase Dashboard → SQL Editor 에서 실행하세요.
--
-- 용량 참고:
--   이미지 1장 평균 1 MB → Supabase Storage 1 GB 무료 = 약 1,000장
--   30일 보관 후 수동 정리 권장

-- 1) 세션 테이블
CREATE TABLE IF NOT EXISTS photo_sessions (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  transformed_url TEXT NOT NULL,          -- Supabase Storage public URL
  job         TEXT NOT NULL DEFAULT '',
  age         TEXT NOT NULL DEFAULT '',
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  expires_at  TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days')
);

-- 2) RLS 활성화
ALTER TABLE photo_sessions ENABLE ROW LEVEL SECURITY;

-- 3) 누구나 읽기 (QR 스캔 후 공개 조회)
DROP POLICY IF EXISTS "Public read photo_sessions" ON photo_sessions;
CREATE POLICY "Public read photo_sessions"
ON photo_sessions FOR SELECT
USING (true);

-- 4) 익명 삽입 허용 (키오스크에서 anon key로 저장)
DROP POLICY IF EXISTS "Anon insert photo_sessions" ON photo_sessions;
CREATE POLICY "Anon insert photo_sessions"
ON photo_sessions FOR INSERT
WITH CHECK (true);

-- 5) 만료 세션 삭제 허용 (lazy cleanup: 새 사진 저장 시 만료분 자동 정리)
DROP POLICY IF EXISTS "Anon delete expired photo_sessions" ON photo_sessions;
CREATE POLICY "Anon delete expired photo_sessions"
ON photo_sessions FOR DELETE
USING (expires_at < NOW());

-- 5) 만료된 세션 조회용 뷰 (선택적)
CREATE OR REPLACE VIEW active_photo_sessions AS
SELECT * FROM photo_sessions
WHERE expires_at > NOW();
