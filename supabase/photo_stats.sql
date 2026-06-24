-- 촬영 통계 (관리자 분석용)
-- Supabase Dashboard → SQL Editor 에서 실행

CREATE TABLE IF NOT EXISTS photo_stats (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  job        TEXT NOT NULL DEFAULT '',
  age        TEXT NOT NULL DEFAULT '',
  gender     TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE photo_stats ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anon insert photo_stats" ON photo_stats;
CREATE POLICY "Anon insert photo_stats"
ON photo_stats FOR INSERT
WITH CHECK (true);

-- 관리자 조회용 뷰 (Dashboard SQL로 확인)
CREATE OR REPLACE VIEW daily_photo_stats AS
SELECT
  DATE(created_at AT TIME ZONE 'Asia/Seoul') AS day,
  job,
  age,
  gender,
  COUNT(*) AS count
FROM photo_stats
GROUP BY 1, 2, 3, 4
ORDER BY 1 DESC, 5 DESC;
