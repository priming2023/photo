import { supabase } from './supabase';

export interface PhotoSession {
  id: string;
  transformed_url: string;
  job: string;
  age: string;
  created_at: string;
  expires_at: string;
}

/**
 * 사진 세션을 DB에 저장하고 세션 ID를 반환
 * 실패 시 null 반환 (QR은 생략하고 계속 진행)
 */
export const savePhotoSession = async (
  transformedUrl: string,
  job: string,
  age: string,
): Promise<string | null> => {
  try {
    const { data, error } = await supabase
      .from('photo_sessions')
      .insert({ transformed_url: transformedUrl, job, age })
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
