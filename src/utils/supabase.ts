import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

/**
 * 업로드 전 이미지 압축
 *
 * 목표: 800 KB → ~150 KB (용량 80% 절감)
 * - 최대 720px (모바일 뷰에 충분한 해상도)
 * - JPEG quality 0.78 (육안으로 차이 없는 수준)
 * - fetch → objectURL 방식으로 Canvas CORS 문제 완전 방지
 */
const compressViaCanvas = (src: string): Promise<Blob> => {
  const MAX_DIM = 720;
  const QUALITY = 0.78;

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      let w = img.naturalWidth;
      let h = img.naturalHeight;
      if (w > MAX_DIM || h > MAX_DIM) {
        const scale = MAX_DIM / Math.max(w, h);
        w = Math.round(w * scale);
        h = Math.round(h * scale);
      }
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      canvas.getContext('2d')!.drawImage(img, 0, 0, w, h);
      canvas.toBlob(
        (b) => (b ? resolve(b) : reject(new Error('toBlob 실패'))),
        'image/jpeg',
        QUALITY,
      );
    };
    img.onerror = () => reject(new Error('이미지 로드 실패'));
    img.src = src;
  });
};

const compressForStorage = async (src: string): Promise<Blob> => {
  const MAX_DIM = 720;
  const QUALITY = 0.78;

  // http URL은 fetch로 먼저 blob 변환 → canvas에 그릴 때 CORS 없음
  let objectUrl: string | null = null;
  let imgSrc = src;

  if (src.startsWith('http')) {
    try {
      const res = await fetch(src, { mode: 'cors' });
      if (!res.ok) throw new Error(`fetch 실패: ${res.status}`);
      const blob = await res.blob();
      objectUrl = URL.createObjectURL(blob);
      imgSrc = objectUrl;
    } catch {
      // Fal CDN 등 CORS fetch 실패 시 canvas crossOrigin 방식으로 재시도
      return compressViaCanvas(src);
    }
  }

  return new Promise((resolve, reject) => {
    const img = new Image();

    img.onload = () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);

      let w = img.naturalWidth;
      let h = img.naturalHeight;

      // 긴 변이 MAX_DIM을 넘으면 비율 유지하며 축소
      if (w > MAX_DIM || h > MAX_DIM) {
        const scale = MAX_DIM / Math.max(w, h);
        w = Math.round(w * scale);
        h = Math.round(h * scale);
      }

      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      canvas.getContext('2d')!.drawImage(img, 0, 0, w, h);

      canvas.toBlob(
        (b) => (b ? resolve(b) : reject(new Error('toBlob 실패'))),
        'image/jpeg',
        QUALITY,
      );
    };

    img.onerror = () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
      reject(new Error('이미지 로드 실패'));
    };

    img.src = imgSrc;
  });
};

/**
 * 이미지를 압축 후 Supabase Storage photos 버킷에 업로드
 *
 * 300명/주 × 7일 보관 시 용량:
 *   압축 전: 300 × 800KB = 240 MB
 *   압축 후: 300 × 150KB = 45 MB  ← Supabase 1GB 무료 내에서 6개월 이상 운영 가능
 */
export const uploadImageToSupabase = async (imageSrc: string): Promise<string> => {
  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('[Supabase] API 키 미설정');
    return '';
  }

  try {
    // 압축 시도 (실패 시 원본 fetch로 fallback)
    let blob: Blob;
    try {
      blob = await compressForStorage(imageSrc);
      console.log(`[Supabase] 압축 완료: ${Math.round(blob.size / 1024)} KB`);
    } catch (e) {
      console.warn('[Supabase] 압축 실패, canvas/fetch 재시도:', e);
      try {
        if (imageSrc.startsWith('http')) {
          blob = await compressViaCanvas(imageSrc);
        } else {
          const res = await fetch(imageSrc);
          blob = await res.blob();
        }
      } catch (e2) {
        console.error('[Supabase] 업로드 에러:', e2);
        return '';
      }
    }

    const fileName = `photo_${Date.now()}_${Math.random().toString(36).slice(2, 8)}.jpg`;

    const { error } = await supabase.storage
      .from('photos')
      .upload(fileName, blob, { contentType: 'image/jpeg', upsert: false });

    if (error) throw error;

    const { data: publicData } = supabase.storage
      .from('photos')
      .getPublicUrl(fileName);

    return publicData.publicUrl;
  } catch (err) {
    console.error('[Supabase] 업로드 에러:', err);
    return '';
  }
};
