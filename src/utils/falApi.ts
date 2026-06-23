import { buildPulidPrompt, NEGATIVE_PROMPT } from './jobPrompts';
import { uploadToFalCdn } from './falCdnUpload';

const PULID_ENDPOINT = 'https://fal.run/fal-ai/flux-pulid';
const TIMEOUT_MS     = 120_000;

// ─── 에러 파싱 ─────────────────────────────────────────────────────────────
const parseFalError = (status: number, body: string): string => {
  try {
    const json = JSON.parse(body) as { detail?: string };
    const detail = json.detail ?? body;
    if (status === 403 && detail.toLowerCase().includes('balance'))
      return 'AI 크레딧이 부족합니다. fal.ai 결제 수단을 확인해 주세요.';
    if (status === 401 || status === 403)
      return 'AI API 키가 유효하지 않습니다. 설정을 확인해 주세요.';
    if (status === 429)
      return 'AI 요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.';
    return `AI 변환 실패 (${status}): ${detail.slice(0, 120)}`;
  } catch {
    return `AI 변환 실패 (${status})`;
  }
};

/**
 * 미래 모습 AI 변환 (flux-pulid 단일 모델)
 *
 * 비용 구조: $0.033/MP — portrait_4_3(768×1024 ≈ 0.79MP) 기준 약 $0.026/장
 *
 * 파이프라인:
 *  1. 원본 사진 → Fal CDN 업로드 (안정적 URL, 품질 손실 없음)
 *  2. flux-pulid 로 얼굴 보존 + 나이·직업 변환
 */
export const generateTransformedImage = async (
  base64Image: string,
  job: string,
  ageStr: string,
  gender: string,
): Promise<string> => {
  const apiKey = import.meta.env.VITE_FAL_KEY as string | undefined;

  if (!apiKey) {
    console.warn('Fal.ai API Key 없음 — 테스트 모드 (5초 대기)');
    await new Promise((r) => setTimeout(r, 5000));
    return '';
  }

  // 1. Fal CDN 업로드 (base64보다 안정적, 변환 품질 향상)
  let cdnUrl: string;
  try {
    cdnUrl = await uploadToFalCdn(base64Image, apiKey);
    console.log('[Fal] CDN 업로드 완료');
  } catch (e) {
    console.warn('[Fal] CDN 업로드 실패, base64 직접 사용:', e);
    cdnUrl = base64Image.startsWith('data:')
      ? base64Image
      : `data:image/jpeg;base64,${base64Image}`;
  }

  // 2. flux-pulid 변환
  const prompt = buildPulidPrompt(job, ageStr, gender);
  console.log('[Fal] 변환 프롬프트:', prompt.slice(0, 120));

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(PULID_ENDPOINT, {
      method: 'POST',
      headers: {
        Authorization: `Key ${apiKey}`,
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
      body: JSON.stringify({
        prompt,
        reference_image_url: cdnUrl,
        image_size: 'portrait_4_3',
        num_inference_steps: 24,
        guidance_scale: 4,
        // id_weight 0.85: 얼굴 보존과 나이·의상 변환의 최적 균형점
        // (1.0이면 얼굴이 너무 고정되어 나이 변환이 약해짐)
        id_weight: 0.85,
        true_cfg: 1,
        negative_prompt: NEGATIVE_PROMPT,
        enable_safety_checker: false,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(parseFalError(res.status, errText));
    }

    const data = await res.json() as { images?: { url: string }[] };
    const url = data?.images?.[0]?.url;
    if (!url) throw new Error('Fal.ai 응답에 이미지 URL이 없습니다.');

    console.log('[Fal] 변환 완료');
    return url;
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError')
      throw new Error('AI 변환 시간이 초과되었습니다. 다시 시도해 주세요.');
    console.error('[Fal] 변환 실패:', err);
    throw err;
  } finally {
    clearTimeout(timer);
  }
};
