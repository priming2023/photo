import { supabase } from './supabase';

export interface PhotoSession {
  id: string;
  transformed_url: string;
  job: string;
  age: string;
  created_at: string;
  expires_at: string;
}

// Storage public URL에서 파일 경로(photos 버킷 내)를 추출
const extractStoragePath = (publicUrl: string): string => {
  const marker = '/storage/v1/object/public/photos/';
  const idx = publicUrl.indexOf(marker);
  return idx >= 0 ? publicUrl.slice(idx + marker.length) : '';
};

/**
 * 만료된 사진 자동 정리 (Storage + DB)
 *
 * 별도 cron/서버 없이 "새 사진 저장 시 호출" 방식 (lazy cleanup)
 * - 새 사진 1장이 저장될 때 이전 만료분을 함께 정리
 * - fire-and-forget: 실패해도 메인 흐름에 영향 없음
 */
const cleanupExpiredPhotos = async (): Promise<void> => {
  const now = new Date().toISOString();

  // 만료된 세션 조회
  const { data: expired, error } = await supabase
    .from('photo_sessions')
    .select('id, transformed_url')
    .lt('expires_at', now);

  if (error || !expired?.length) return;

  // Storage 파일 삭제
  const paths = expired
    .map((s) => extractStoragePath(s.transformed_url))
    .filter(Boolean);

  if (paths.length) {
    const { error: storageErr } = await supabase.storage
      .from('photos')
      .remove(paths);
    if (storageErr) {
      console.warn('[Cleanup] Storage 삭제 부분 실패:', storageErr.message);
    }
  }

  // DB 레코드 삭제
  await supabase
    .from('photo_sessions')
    .delete()
    .lt('expires_at', now);

  console.log(`[Cleanup] 만료 사진 ${expired.length}장 정리 완료`);
};

/**
 * 사진 세션을 DB에 저장하고 세션 ID를 반환
 *
 * - 보관 기간: 7일 (300명/주 × 150KB ≈ 45MB → Supabase 1GB 무료로 6개월 운영 가능)
 * - 저장과 동시에 만료 세션 백그라운드 정리
 * - 실패 시 null 반환 (앱은 QR 없이 계속 동작)
 */
export const savePhotoSession = async (
  transformedUrl: string,
  job: string,
  age: string,
): Promise<string | null> => {
  // 만료 세션 백그라운드 정리 (awaiting 없이 fire-and-forget)
  void cleanupExpiredPhotos();

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // 7일 후 만료

  try {
    const { data, error } = await supabase
      .from('photo_sessions')
      .insert({
        transformed_url: transformedUrl,
        job,
        age,
        expires_at: expiresAt.toISOString(),
      })
      .select('id')
      .single();

    if (error) throw error;
    return data.id as string;
  } catch (err) {
    console.error('[Session] 저장 실패:', err);
    return null;
  }
};

/**
 * 세션 ID로 사진 세션 조회
 * 없거나 만료됐으면 null 반환
 */
export const getPhotoSession = async (id: string): Promise<PhotoSession | null> => {
  try {
    const { data, error } = await supabase
      .from('photo_sessions')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data as PhotoSession;
  } catch (err) {
    console.error('[Session] 조회 실패:', err);
    return null;
  }
};

/** 뷰 페이지 전체 URL 생성 */
export const buildViewUrl = (sessionId: string): string =>
  `${window.location.origin}/view?id=${sessionId}`;
