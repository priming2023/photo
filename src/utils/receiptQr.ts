import { uploadImageToSupabase } from './supabase';
import { savePhotoSession, buildViewUrl } from './photoSession';

export type QrPrepareStatus = 'ok' | 'fallback' | 'home';

export interface QrPrepareResult {
  qrUrl: string;
  status: QrPrepareStatus;
}

/** QR에 넣을 최소 폴백 URL (스토리지·세션 모두 실패 시) */
export const getReceiptQrFallbackUrl = (): string => {
  const base =
    (import.meta.env.VITE_PUBLIC_APP_URL as string | undefined)?.replace(/\/$/, '') ||
    window.location.origin;
  return base;
};

const uploadWithRetry = async (src: string, attempts = 4): Promise<string> => {
  for (let i = 0; i < attempts; i++) {
    const url = await uploadImageToSupabase(src);
    if (url) return url;
    await new Promise((r) => setTimeout(r, 600 * (i + 1)));
  }
  return '';
};

/**
 * 영수증 QR용 URL 준비 — 세션 뷰 URL 우선, 실패 시 스토리지·홈 URL 폴백
 * 항상 스캔 가능한 URL을 반환 (placeholder 없음)
 */
export const prepareReceiptQrUrl = async (
  originalImage: string,
  transformedImage: string | undefined,
  job: string,
  age: string,
  gender: string,
): Promise<QrPrepareResult> => {
  const transformedStorageUrl = await uploadWithRetry(
    transformedImage || originalImage,
  );

  if (!transformedStorageUrl) {
    console.warn('[QR] 업로드 실패 → 홈 URL 폴백');
    return { qrUrl: getReceiptQrFallbackUrl(), status: 'home' };
  }

  const originalStorageUrl = await uploadWithRetry(originalImage);
  const sessionId = await savePhotoSession(
    transformedStorageUrl,
    originalStorageUrl || transformedStorageUrl,
    job,
    age,
    gender,
  );

  if (sessionId) {
    return { qrUrl: buildViewUrl(sessionId), status: 'ok' };
  }

  console.warn('[QR] 세션 저장 실패 → 스토리지 URL 폴백');
  return { qrUrl: transformedStorageUrl, status: 'fallback' };
};
