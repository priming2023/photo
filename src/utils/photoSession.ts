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
  try {
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
      await supabase.storage.from('photos').remove(paths);
    }
    await supabase.from('photo_sessions').delete().lt('expires_at', now);
  } catch (e) {
    console.warn('[Cleanup] 만료 정리 실패 (무시):', e);
  }
};

const tryInsert = async (
  payload: Record<string, string>,
): Promise<string | null> => {
  const { data, error } = await supabase
    .from('photo_sessions')
    .insert(payload)
    .select('id')
    .single();

  if (error) throw error;
  return data.id as string;
};

/**
 * 세션 저장 — 3회 재시도 + original_url 폴백
 * cleanup은 저장 성공 후 실행 (저장 방해하지 않음)
 */
export const savePhotoSession = async (
  transformedUrl: string,
  originalUrl: string,
  job: string,
  age: string,
  gender?: string,
): Promise<string | null> => {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 14);
  const expires_at = expiresAt.toISOString();

  const fullPayload = {
    transformed_url: transformedUrl,
    original_url: originalUrl || transformedUrl,
    job,
    age,
    expires_at,
  };
  const minimalPayload = { transformed_url: transformedUrl, job, age, expires_at };

  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const id = await tryInsert(fullPayload);
      void cleanupExpiredPhotos();
      void logPhotoStat(job, age, gender);
      return id;
    } catch (err) {
      console.warn(`[Session] 저장 시도 ${attempt}/3 실패:`, err);
      if (attempt === 3) {
        try {
          const id = await tryInsert(minimalPayload);
          void cleanupExpiredPhotos();
          void logPhotoStat(job, age, gender);
          return id;
        } catch (err2) {
          console.error('[Session] 최종 저장 실패:', err2);
          return null;
        }
      }
      await new Promise((r) => setTimeout(r, 400 * attempt));
    }
  }
  return null;
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

export const buildViewUrl = (sessionId: string): string => {
  // 키오스크 도메인과 배포 URL이 다를 수 있음 → Vercel 공개 URL 우선
  const base =
    (import.meta.env.VITE_PUBLIC_APP_URL as string | undefined)?.replace(/\/$/, '') ||
    window.location.origin;
  return `${base}/view?id=${sessionId}`;
};

/** 촬영 통계 기록 (실패해도 세션 저장에 영향 없음) */
const logPhotoStat = async (job: string, age: string, gender?: string): Promise<void> => {
  try {
    await supabase.from('photo_stats').insert({
      job,
      age,
      gender: gender || '',
    });
  } catch (e) {
    console.warn('[Stats] 기록 실패 (무시):', e);
  }
};
