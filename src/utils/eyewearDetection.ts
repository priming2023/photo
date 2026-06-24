import { uploadToFalCdn } from './falCdnUpload';

const MOONDREAM_ENDPOINT = 'https://fal.run/fal-ai/moondream2/visual-query';

export type EyewearState = 'wearing' | 'not_wearing';

/**
 * Fal Vision(moondream2)으로 안경 착용 여부 확인
 * — canvas 휴리스틱 오탐 대비, 사용자 선택이 없을 때만 사용
 */
export const detectEyewearVision = async (
  imageSrc: string,
  apiKey: string,
): Promise<EyewearState | null> => {
  try {
    let imageUrl = imageSrc;
    if (imageSrc.startsWith('data:')) {
      imageUrl = await uploadToFalCdn(imageSrc, apiKey);
    }

    const res = await fetch(MOONDREAM_ENDPOINT, {
      method: 'POST',
      headers: {
        Authorization: `Key ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        image_url: imageUrl,
        prompt: 'Is this person wearing eyeglasses or spectacles on their eyes? Answer only yes or no.',
      }),
    });

    if (!res.ok) return null;

    const data = await res.json() as { output?: string };
    const answer = (data.output || '').toLowerCase().trim();
    console.log('[Eyewear Vision]', answer);

    if (/\byes\b/.test(answer)) return 'wearing';
    if (/\bno\b/.test(answer)) return 'not_wearing';
    return null;
  } catch (e) {
    console.warn('[Eyewear Vision] 실패:', e);
    return null;
  }
};

export const getEyewearPrompt = (state: EyewearState): string => {
  if (state === 'wearing') {
    return [
      'wearing the same eyeglasses as in the reference photo',
      'identical glasses frame shape color and thickness',
      'preserve eyewear exactly do not remove glasses',
    ].join(', ');
  }
  return [
    'ABSOLUTELY NO eyeglasses NO spectacles NO sunglasses on face',
    'bare eyes clearly visible without any eyewear frames',
    'do not add glasses under any circumstances',
  ].join(', ');
};

export const getEyewearNegative = (state: EyewearState): string => {
  if (state === 'wearing') {
    return 'removing glasses, no eyeglasses, bare eyes without glasses, wrong glasses style';
  }
  return [
    'eyeglasses',
    'glasses',
    'spectacles',
    'sunglasses',
    'reading glasses',
    'wire-rim glasses',
    'rimless glasses',
    'thick-frame glasses',
    'frameless glasses',
    'adding eyewear',
    'wearing glasses',
    'optical frames on face',
  ].join(', ');
};

/** 안경 미착용: 참조 얼굴(맨눈)을 빨리 고정 / 착용: 보존 강화 */
export const getEyewearPulidAdjust = (
  state: EyewearState,
): { idWeightDelta: number; startStep: number } => {
  if (state === 'wearing') {
    return { idWeightDelta: 0.02, startStep: 2 };
  }
  // 미착용: 참조 사진의 맨눈을 빠르게 고정해 AI가 안경을 덧씌우지 못하게
  return { idWeightDelta: 0.03, startStep: 2 };
};
