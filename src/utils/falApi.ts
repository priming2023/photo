import { buildPulidPrompt, buildNegativePrompt, getPulidParams } from './jobPrompts';
import { uploadToFalCdn } from './falCdnUpload';
import { cropToPortrait } from './imagePreprocess';

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
 *     - id_weight / start_step: 나이별 동적 (getPulidParams)
 *       젊을수록 얼굴 고정, 나이 많을수록 노화 표현 허용
 *     - 동적 네거티브 프롬프트 — 나이별 과노화 방지
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

  // 3. flux-pulid 변환
  const prompt         = buildPulidPrompt(job, ageStr, gender);
  const negativePrompt = buildNegativePrompt(ageStr);
  // 나이별 파라미터 — 젊으면 얼굴 고정, 나이 많으면 노화 표현 허용
  const { id_weight, start_step } = getPulidParams(ageStr);
  console.log('[Fal] 프롬프트 앞부분:', prompt.slice(0, 100));
  console.log(`[Fal] 나이별 파라미터: id_weight=${id_weight}, start_step=${start_step}`);

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
        // landscape_4_3: 가로형 출력 → 영수증 박스(가로형)와 비율 일치
        // portrait_4_3(이전): 영수증에서 49%만 표시 → 얼굴 잘림
        // landscape_4_3(현재): 영수증에서 88% 표시 → 얼굴 자연스럽게 표시
        image_size: 'landscape_4_3',
        num_inference_steps: 28,
        guidance_scale: 3.5,
        // ──────────────────────────────────────────────────────────────
        // id_weight / start_step: 나이별 동적 적용 (getPulidParams)
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
