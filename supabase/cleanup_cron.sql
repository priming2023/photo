-- 만료된 사진 세션 + Storage 파일 자동 정리 (pg_cron)
-- Supabase Dashboard → SQL Editor 에서 1회 실행
--
-- 사전 조건: Dashboard → Database → Extensions → pg_cron 활성화
-- 스케줄: 매일 KST 03:00 (UTC 18:00)

-- Storage URL에서 파일 경로 추출
CREATE OR REPLACE FUNCTION extract_photo_path(url TEXT)
RETURNS TEXT AS $$
BEGIN
  IF url IS NULL THEN RETURN NULL; END IF;
  RETURN substring(url FROM '/photos/(.+)$');
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 만료 세션 정리 (DB + Storage)
CREATE OR REPLACE FUNCTION cleanup_expired_photo_sessions()
RETURNS INTEGER AS $$
DECLARE
  rec RECORD;
  deleted_count INTEGER := 0;
  path TEXT;
BEGIN
  FOR rec IN
    SELECT id, transformed_url, original_url
    FROM photo_sessions
    WHERE expires_at < NOW()
  LOOP
    path := extract_photo_path(rec.transformed_url);
    IF path IS NOT NULL THEN
      DELETE FROM storage.objects WHERE bucket_id = 'photos' AND name = path;
    END IF;

    path := extract_photo_path(rec.original_url);
    IF path IS NOT NULL AND path <> extract_photo_path(rec.transformed_url) THEN
      DELETE FROM storage.objects WHERE bucket_id = 'photos' AND name = path;
    END IF;

    DELETE FROM photo_sessions WHERE id = rec.id;
    deleted_count := deleted_count + 1;
  END LOOP;

  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 기존 스케줄 제거 후 재등록
SELECT cron.unschedule('cleanup-expired-photos')
WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'cleanup-expired-photos');

SELECT cron.schedule(
  'cleanup-expired-photos',
  '0 18 * * *',
  $$SELECT cleanup_expired_photo_sessions();$$
);
