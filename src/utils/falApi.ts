import { buildKontextPrompt, buildPulidPrompt, NEGATIVE_PROMPT } from './jobPrompts';
import { uploadToFalCdn } from './falCdnUpload';

const KONTEXT_ENDPOINT = 'https://fal.run/fal-ai/flux-pro/kontext';
const PULID_ENDPOINT   = 'https://fal.run/fal-ai/flux-pulid';
const TIMEOUT_MS       = 120_000;

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

// ─── fetch 래퍼 (타임아웃 포함) ────────────────────────────────────────────
const falFetch = async (
  endpoint: string,
  apiKey: string,
  body: Record<string, unknown>,
): Promise<string> => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        Authorization: `Key ${apiKey}`,
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(parseFalError(res.status, errText));
    }

    const data = await res.json() as { images?: { url: string }[] };
    const url = data?.images?.[0]?.url;
    if (!url) throw new Error('Fal.ai 응답에 이미지 URL이 없습니다.');
    return url;
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError')
      throw new Error('AI 변환 시간이 초과되었습니다. 다시 시도해 주세요.');
    throw err;
  } finally {
    clearTimeout(timer);
  }
};

// ─── 1단계: flux-pro/kontext (이미지 직접 편집 — 나이·직업 변환 특화) ──────
const transformWithKontext = async (
  cdnUrl: string,
  job: string,
  ageStr: string,
  gender: string,
  apiKey: string,
): Promise<string> => {
  const prompt = buildKontextPrompt(job, ageStr, gender);
  return falFetch(KONTEXT_ENDPOINT, apiKey, {
    prompt,
    image_url: cdnUrl,
    num_inference_steps: 30,
    guidance_scale: 4,
  });
};

// ─── 폴백: flux-pulid (얼굴 보존 특화) ────────────────────────────────────
const transformWithPulid = async (
  cdnUrl: string,
  job: string,
  ageStr: string,
  gender: string,
  apiKey: string,
): Promise<string> => {
  const prompt = buildPulidPrompt(job, ageStr, gender);
  return falFetch(PULID_ENDPOINT, apiKey, {
    prompt,
    reference_image_url: cdnUrl,
    image_size: 'portrait_4_3',
    num_inference_steps: 30,
    guidance_scale: 4,
    // id_weight 0.85: 얼굴 보존(1.0)보다 낮춰서 나이·의상 변환에 더 자유도 부여
    id_weight: 0.85,
    true_cfg: 1,
    negative_prompt: NEGATIVE_PROMPT,
    enable_safety_checker: false,
  });
};

// ─── 메인 진입점 ───────────────────────────────────────────────────────────
/**
 * 미래 모습 AI 변환
 *
 * 파이프라인:
 *  1. 원본 사진 → Fal CDN 업로드 (안정적 URL 확보)
 *  2. flux-pro/kontext 로 나이·직업 변환 (1차 시도)
 *  3. kontext 실패 시 flux-pulid 로 폴백 (얼굴 보존 강점)
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

  // 1. Fal CDN 업로드
  let cdnUrl: string;
  try {
    cdnUrl = await uploadToFalCdn(base64Image, apiKey);
    console.log('[Fal] CDN 업로드 완료:', cdnUrl);
  } catch (e) {
    // CDN 업로드 실패 시 base64 직접 사용 (폴백)
    console.warn('[Fal] CDN 업로드 실패, base64 직접 사용:', e);
    cdnUrl = base64Image.startsWith('data:')
      ? base64Image
      : `data:image/jpeg;base64,${base64Image}`;
  }

  // 2. kontext 로 1차 변환
  try {
    const result = await transformWithKontext(cdnUrl, job, ageStr, gender, apiKey);
    console.log('[Fal] kontext 변환 성공');
    return result;
  } catch (kontextError) {
    console.warn('[Fal] kontext 실패, pulid 폴백 시도:', kontextError);
  }

  // 3. pulid 폴백
  const result = await transformWithPulid(cdnUrl, job, ageStr, gender, apiKey);
  console.log('[Fal] pulid 폴백 변환 성공');
  return result;
};
