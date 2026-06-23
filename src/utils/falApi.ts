import { buildTransformationPrompt, NEGATIVE_PROMPT } from './jobPrompts';
import { uploadImageToSupabase } from './supabase';

const FAL_ENDPOINT = 'https://fal.run/fal-ai/flux-pulid';
const REQUEST_TIMEOUT_MS = 120_000;

const parseFalError = (status: number, body: string): string => {
  try {
    const json = JSON.parse(body) as { detail?: string };
    const detail = json.detail ?? body;

    if (status === 403 && detail.toLowerCase().includes('balance')) {
      return 'AI 크레딧이 부족합니다. fal.ai 결제 수단을 확인해 주세요.';
    }
    if (status === 401 || status === 403) {
      return 'AI API 키가 유효하지 않습니다. 설정을 확인해 주세요.';
    }
    if (status === 429) {
      return 'AI 요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.';
    }
    return `AI 변환 실패 (${status}): ${detail}`;
  } catch {
    return `AI 변환 실패 (${status})`;
  }
};

/** canvas data URL을 Fal.ai가 받을 수 있는 형식으로 정규화 */
const normalizeReferenceImage = (image: string): string => {
  if (image.startsWith('data:')) return image;
  return `data:image/jpeg;base64,${image}`;
};

/** Supabase URL이 있으면 사용 (대용량 base64보다 안정적) */
const resolveReferenceUrl = async (base64Image: string): Promise<string> => {
  const uploaded = await uploadImageToSupabase(base64Image);
  if (uploaded) return uploaded;
  return normalizeReferenceImage(base64Image);
};

/**
 * Fal.ai Flux-PuLID — 얼굴 보존 + 나이·직업 변환
 * @returns 변환된 이미지 URL (실패 시 빈 문자열)
 */
export const generateTransformedImage = async (
  base64Image: string,
  job: string,
  ageStr: string,
  gender: string,
): Promise<string> => {
  const apiKey = import.meta.env.VITE_FAL_KEY;

  if (!apiKey) {
    console.warn('Fal.ai API Key 없음 — 테스트 모드 (5초 후 폴백)');
    await new Promise((resolve) => setTimeout(resolve, 5000));
    return '';
  }

  const prompt = buildTransformationPrompt(job, ageStr, gender);
  const referenceImageUrl = await resolveReferenceUrl(base64Image);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(FAL_ENDPOINT, {
      method: 'POST',
      headers: {
        Authorization: `Key ${apiKey}`,
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
      body: JSON.stringify({
        prompt,
        reference_image_url: referenceImageUrl,
        image_size: 'portrait_4_3',
        num_inference_steps: 24,
        guidance_scale: 4,
        id_weight: 1.0,
        true_cfg: 1,
        negative_prompt: NEGATIVE_PROMPT,
        enable_safety_checker: false,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(parseFalError(response.status, errText));
    }

    const data = await response.json();
    const resultUrl: string | undefined = data?.images?.[0]?.url;

    if (!resultUrl) {
      throw new Error('Fal.ai 응답에 이미지 URL이 없습니다.');
    }

    return resultUrl;
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new Error('AI 변환이 시간 초과되었습니다. 다시 시도해 주세요.');
    }
    console.error('Fal.ai 이미지 생성 실패:', error);
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
};
