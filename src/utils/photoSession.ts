import { supabase } from './supabase';

export interface PhotoSession {
  id: string;
  original_url: string | null;
  transformed_url: string;
  job: string;
  age: string;
  created_at: string;
  expires_at: string;
}

const extractStoragePath = (publicUrl: string): string => {
  const marker = '/storage/v1/object/public/photos/';
  const idx = publicUrl.indexOf(marker);
  return idx >= 0 ? publicUrl.slice(idx + marker.length) : '';
};

const cleanupExpiredPhotos = async (): Promise<void> => {
  const now = new Date().toISOString();

  const { data: expired, error } = await supabase
    .from('photo_sessions')
    .select('id, original_url, transformed_url')
    .lt('expires_at', now);

  if (error || !expired?.length) return;

  const paths = expired.flatMap((s) => [
    extractStoragePath(s.transformed_url),
    s.original_url ? extractStoragePath(s.original_url) : '',
  ]).filter(Boolean);

  if (paths.length) {
    const { error: storageErr } = await supabase.storage.from('photos').remove(paths);
    if (storageErr) console.warn('[Cleanup] Storage 삭제 부분 실패:', storageErr.message);
  }

  await supabase.from('photo_sessions').delete().lt('expires_at', now);
  console.log(`[Cleanup] 만료 세션 ${expired.length}건 정리 완료`);
};

/**
 * 현재·미래 사진 URL을 DB에 저장
 * 보관: 14일 / 용량: 2장 × ~150KB ≈ 300KB/명
 */
export const savePhotoSession = async (
  transformedUrl: string,
  originalUrl: string,
  job: string,
  age: string,
): Promise<string | null> => {
  void cleanupExpiredPhotos();

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 14);
  const expires_at = expiresAt.toISOString();

  // 1차: original_url 포함 저장
  try {
    const { data, error } = await supabase
      .from('photo_sessions')
      .insert({ transformed_url: transformedUrl, original_url: originalUrl, job, age, expires_at })
      .select('id')
      .single();

    if (error) throw error;
    return data.id as string;
  } catch (err) {
    // original_url 컬럼 미생성(마이그레이션 미실행) 등으로 실패 시 →
    // original_url 없이 재시도해 최소한 QR(미래 사진)은 동작하도록 보장
    console.warn('[Session] original_url 포함 저장 실패, 미포함으로 재시도:', err);
    try {
      const { data, error } = await supabase
        .from('photo_sessions')
        .insert({ transformed_url: transformedUrl, job, age, expires_at })
        .select('id')
        .single();

      if (error) throw error;
      return data.id as string;
    } catch (err2) {
      console.error('[Session] 저장 최종 실패:', err2);
      return null;
    }
  }
};

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

export const buildViewUrl = (sessionId: string): string =>
  `${window.location.origin}/view?id=${sessionId}`;
