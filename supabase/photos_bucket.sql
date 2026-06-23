-- 월드킹 포토부스: Supabase Storage 설정
-- Supabase Dashboard → SQL Editor 에서 실행하세요.
-- (setudy와 동일한 Supabase 계정에서 새 프로젝트를 만들었거나, 기존 프로젝트에 적용)

-- 1) photos 버킷 생성 (public)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'photos',
  'photos',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp'];

-- 2) 누구나 읽기 (QR 공유용 public URL)
DROP POLICY IF EXISTS "Public read photos" ON storage.objects;
CREATE POLICY "Public read photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'photos');

-- 3) 익명 업로드 허용 (키오스크에서 anon key로 업로드)
DROP POLICY IF EXISTS "Anon upload photos" ON storage.objects;
CREATE POLICY "Anon upload photos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'photos');

-- 4) 만료 사진 파일 삭제 허용 (lazy cleanup 용)
DROP POLICY IF EXISTS "Anon delete photos" ON storage.objects;
CREATE POLICY "Anon delete photos"
ON storage.objects FOR DELETE
USING (bucket_id = 'photos');
