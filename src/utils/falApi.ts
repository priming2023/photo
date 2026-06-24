import { buildPulidPrompt, buildNegativePrompt, getPulidParams } from './jobPrompts';
import { uploadToFalCdn } from './falCdnUpload';
import { cropToPortrait } from './imagePreprocess';
import { detectEyewear, getEyewearNegative, getEyewearPulidAdjust } from './eyewearDetection';
import { detectSubjectAge, getChildAgeWeightAdjust } from './subjectAgeDetection';

const PULID_ENDPOINT = 'https://fal.run/fal-ai/flux-pulid';
const TIMEOUT_MS     = 120_000;

// ─── 에러 파싱 ─────────────────────────────────────────────────────────────
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

/**
 * 미래 모습 AI 변환 (flux-pulid)
 *
 * 파이프라인:
 *  1. 이미지 전처리 — 가로(16:9) → 세로 3:4 크롭 768×1024
 *     (얼굴이 이미지의 50% 이상을 차지하도록 → AI 집중도 극대화)
 *  2. Fal CDN 업로드 — base64보다 안정적, 품질 무손실
 *  3. flux-pulid 변환
 *     - start_step: 4  — PuLID 공식 권장값 (realistic images)
 *       step 0~3: 텍스트 프롬프트(직업·나이)로 자유 생성
 *       step 4~: 얼굴 ID 주입 → 얼굴 보존과 변환이 동시에 달성
 *     - id_weight 0.84~0.95: 닮음 우선 (PuLID 공식)
 *     - start_step 2~4: 공식 권장 범위 (5+ 금지 — 닮음 붕괴)
 *     - guidance 3.5 고정: fake CFG 자연스러운 실사
 *     - 노화는 프롬프트(머리색·주름)로 표현, 파라미터로 억지 금지
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

  // 1. 이미지 전처리: 가로 → 세로 portrait 크롭
  let processedImage: string;
  try {
    processedImage = await cropToPortrait(base64Image);
    console.log('[Fal] 이미지 전처리 완료 (portrait 3:4 크롭)');
  } catch (e) {
    console.warn('[Fal] 이미지 전처리 실패, 원본 사용:', e);
    processedImage = base64Image;
  }

  // 2. Fal CDN 업로드
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

  // 3. 안경 착용 여부 + 촬영자 연령대 병렬 감지
  const [eyewear, subjectAge] = await Promise.all([
    detectEyewear(processedImage),
    detectSubjectAge(processedImage),
  ]);
  console.log(
    `[Fal] 안경: ${eyewear === 'wearing' ? '✅착용' : eyewear === 'not_wearing' ? '❌미착용' : '❓불확실(참조따름)'} | ` +
    `피사체: ${subjectAge === 'child' ? '👶어린이' : '🧑성인'}`,
  );

  // 4. flux-pulid 변환
  const prompt         = buildPulidPrompt(job, ageStr, gender, eyewear, subjectAge);
  const negativePrompt = buildNegativePrompt(ageStr, gender, getEyewearNegative(eyewear));

  // 나이·성별·피사체연령 파라미터 조합
  let { id_weight, start_step, guidance_scale } = getPulidParams(ageStr, gender);

  // 안경 착용·불확실: 참조 이미지 충실도 높여 안경 drift 방지
  const eyewearAdjust = getEyewearPulidAdjust(eyewear);
  if (eyewearAdjust.idWeightBoost > 0) {
    id_weight = Math.min(id_weight + eyewearAdjust.idWeightBoost, 0.95);
  }
  if (eyewearAdjust.startStepReduce > 0) {
    start_step = Math.max(start_step - eyewearAdjust.startStepReduce, 2);
  }
  if (eyewear !== 'not_wearing') {
    console.log(`[Fal] 안경 보존 보정: id=${id_weight}, step=${start_step}`);
  }

  // 어린이 감지 시 id_weight 소폭 하향 → 성장 변환 허용 (start_step 고정 — 닮음 붕괴 방지)
  if (subjectAge === 'child') {
    const adjust = getChildAgeWeightAdjust(ageStr);
    id_weight = Math.max(id_weight + adjust, 0.85);
    console.log(`[Fal] 어린이 보정: id_weight ${(id_weight - adjust).toFixed(2)} → ${id_weight.toFixed(2)}`);
  }
  console.log('[Fal] 프롬프트 앞부분:', prompt.slice(0, 120));
  console.log(`[Fal] 파라미터 (${gender} ${ageStr}): id=${id_weight}, step=${start_step}, guidance=${guidance_scale}`);

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
        // portrait_4_3: 단일 인물·얼굴 분할(split) 오류 방지
        // (landscape_4_3는 가로 넓어 2명/반반 얼굴 아티팩트 발생 가능)
        image_size: 'portrait_4_3',
        num_inference_steps: 28,
        guidance_scale,
        // ──────────────────────────────────────────────────────────────
        // id_weight / start_step / guidance_scale: 나이별 동적 적용 (getPulidParams)
        //   젊은 나이(25/35): id_weight↑ start_step↓ → 얼굴 강하게 고정
        //   많은 나이(55/65): id_weight↓ start_step↑ → 노화가 표현되도록 편집 허용
        //   (이전 고정값 0.92/3 → 65세도 젊은 얼굴이 고정되어 노화 안 됨)
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
