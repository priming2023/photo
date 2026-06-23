/**
 * Fal.ai CDN 업로드
 * base64 data URL → Fal CDN URL (https://v3.fal.media/...)
 *
 * Supabase나 raw base64 대신 이 URL을 reference_image_url로 사용하면
 * - Fal 서버와 동일 네트워크라 전송 속도가 빠름
 * - CORS 문제 없음
 * - 이미지 품질 손실 없음
 */
export const uploadToFalCdn = async (
  base64DataUrl: string,
  apiKey: string,
): Promise<string> => {
  // 1. base64 → Blob
  const fetchRes = await fetch(base64DataUrl);
  const blob = await fetchRes.blob();
  const contentType = blob.type || 'image/jpeg';

  // 2. 서명된 업로드 URL 요청
  const initiateRes = await fetch(
    'https://rest.alpha.fal.ai/storage/upload/initiate',
    {
      method: 'POST',
      headers: {
        Authorization: `Key ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        content_type: contentType,
        file_name: `photo_${Date.now()}.jpg`,
      }),
    },
  );

  if (!initiateRes.ok) {
    throw new Error(`Fal CDN 초기화 실패: ${initiateRes.status}`);
  }

  const { file_url, upload_url } = (await initiateRes.json()) as {
    file_url: string;
    upload_url: string;
  };

  // 3. 실제 파일 업로드 (PUT)
  const uploadRes = await fetch(upload_url, {
    method: 'PUT',
    headers: { 'Content-Type': contentType },
    body: blob,
  });

  if (!uploadRes.ok) {
    throw new Error(`Fal CDN 업로드 실패: ${uploadRes.status}`);
  }

  return file_url;
};
