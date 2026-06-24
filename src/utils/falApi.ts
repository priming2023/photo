import { buildPulidPrompt, buildNegativePrompt, getPulidParams } from './jobPrompts';
import { uploadToFalCdn } from './falCdnUpload';
import { cropToPortrait } from './imagePreprocess';
import {
  detectEyewearAuto,
  getEyewearNegative,
  getEyewearPulidAdjust,
} from './eyewearDetection';
import { JOB_NEGATIVES } from './occupationPrompts';
import {
  CHILD_APPEARANCE_AGE_OFFSET,
  detectSubjectAge,
  getChildAgeWeightAdjust,
  getEffectiveAgeStr,
} from './subjectAgeDetection';

const PULID_ENDPOINT = 'https://fal.run/fal-ai/flux-pulid';
const TIMEOUT_MS     = 120_000;

const parseFalError = (status: number, body: string): string => {
  try {
    const json   = JSON.parse(body) as { detail?: string };
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

  let processedImage: string;
  try {
    processedImage = await cropToPortrait(base64Image);
    console.log('[Fal] 이미지 전처리 완료 (portrait 3:4 크롭)');
  } catch (e) {
    console.warn('[Fal] 이미지 전처리 실패, 원본 사용:', e);
    processedImage = base64Image;
  }

  let cdnUrl: string;
  try {
    cdnUrl = await uploadToFalCdn(processedImage, apiKey);
    console.log('[Fal] CDN 업로드 완료');
  } catch (e) {
    console.warn('[Fal] CDN 업로드 실패, base64 직접 사용:', e);
    cdnUrl = processedImage.startsWith('data:')
      ? processedImage
      : `data:image/jpeg;base64,${processedImage}`;
  }

  const [eyewear, subjectAge] = await Promise.all([
    detectEyewearAuto(processedImage, apiKey),
    detectSubjectAge(processedImage),
  ]);
  console.log(
    `[Fal] 안경(자동): ${eyewear === 'wearing' ? '✅착용' : '❌미착용'} | ` +
    `피사체: ${subjectAge === 'child' ? '👶어린이' : '🧑성인'}`,
  );

  const renderAgeStr = getEffectiveAgeStr(ageStr, subjectAge);
  if (subjectAge === 'child' && renderAgeStr !== ageStr) {
    console.log(
      `[Fal] 어린이 +${CHILD_APPEARANCE_AGE_OFFSET}살: 선택 ${ageStr} → AI ${renderAgeStr}`,
    );
  }

  const prompt         = buildPulidPrompt(job, renderAgeStr, gender, eyewear, subjectAge);
  const jobNegative    = JOB_NEGATIVES[job] ?? '';
  const negativePrompt = buildNegativePrompt(
    renderAgeStr,
    gender,
    [getEyewearNegative(eyewear), jobNegative].filter(Boolean).join(', '),
  );

  let { id_weight, start_step, guidance_scale } = getPulidParams(renderAgeStr, gender);

  const eyewearAdjust = getEyewearPulidAdjust(eyewear);
  id_weight = Math.min(Math.max(id_weight + eyewearAdjust.idWeightDelta, 0.82), 0.95);
  start_step = eyewearAdjust.startStep;
  console.log(`[Fal] 안경 PuLID: id=${id_weight}, step=${start_step}`);

  if (subjectAge === 'child') {
    const adjust = getChildAgeWeightAdjust(renderAgeStr);
    id_weight = Math.max(id_weight + adjust, 0.85);
    console.log(`[Fal] 어린이 보정: id_weight → ${id_weight.toFixed(2)}`);
  }

  console.log('[Fal] 프롬프트 앞부분:', prompt.slice(0, 140));
  console.log(
    `[Fal] 파라미터 (${gender} 선택${ageStr}` +
    `${subjectAge === 'child' ? ` / 표현${renderAgeStr}` : ''}): ` +
    `id=${id_weight}, step=${start_step}, guidance=${guidance_scale}`,
  );

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
        num_inference_steps: 26,
        guidance_scale,
        id_weight,
        start_step,
        true_cfg: 1,
        negative_prompt: negativePrompt,
        max_sequence_length: '256',
        enable_safety_checker: false,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(parseFalError(res.status, errText));
    }

    const data = await res.json() as { images?: { url: string }[] };
    const url  = data?.images?.[0]?.url;
    if (!url) throw new Error('Fal.ai 응답에 이미지 URL이 없습니다.');

    console.log('[Fal] 변환 완료:', url.slice(0, 60));
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
