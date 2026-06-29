import { uploadToFalCdn } from './falCdnUpload';

const MOONDREAM_ENDPOINT = 'https://fal.run/fal-ai/moondream2/visual-query';

export type EyewearState = 'wearing' | 'not_wearing';

const PRIMARY_PROMPT =
  'Look at this person\'s eyes and nose bridge. ' +
  'Are they wearing prescription eyeglasses or spectacles with visible frames on their face? ' +
  '(Safety goggles on the forehead do NOT count.) Answer only yes or no.';

const CONFIRM_PROMPT =
  'Can you clearly see eyeglass or spectacle frames sitting on this person\'s eyes? ' +
  'Answer only yes or no.';

const parseYesNo = (output: string): EyewearState | null => {
  const answer = output.toLowerCase().trim();
  if (/\byes\b/.test(answer)) return 'wearing';
  if (/\bno\b/.test(answer)) return 'not_wearing';
  return null;
};

const queryVision = async (
  imageUrl: string,
  apiKey: string,
  prompt: string,
): Promise<EyewearState | null> => {
  const res = await fetch(MOONDREAM_ENDPOINT, {
    method: 'POST',
    headers: {
      Authorization: `Key ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ image_url: imageUrl, prompt }),
  });

  if (!res.ok) return null;

  const data = await res.json() as { output?: string };
  return parseYesNo(data.output || '');
};

/**
 * 촬영 사진에서 안경 착용 여부 자동 감지
 * — 1차 판정 후 "착용"일 때만 2차 확인 (오탐·직업 편향 방지)
 * — 불확실·실패 시 미착용 (AI가 안경을 덧씌우는 쪽이 더 흔한 오류)
 */
export const detectEyewearAuto = async (
  imageSrc: string,
  apiKey: string,
): Promise<EyewearState> => {
  try {
    let imageUrl = imageSrc;
    if (imageSrc.startsWith('data:')) {
      imageUrl = await uploadToFalCdn(imageSrc, apiKey);
    }

    const primary = await queryVision(imageUrl, apiKey, PRIMARY_PROMPT);
    console.log('[Eyewear Vision] 1차:', primary ?? 'unknown');

    if (primary !== 'wearing') {
      return 'not_wearing';
    }

    const confirm = await queryVision(imageUrl, apiKey, CONFIRM_PROMPT);
    console.log('[Eyewear Vision] 2차 확인:', confirm ?? 'unknown');

    return confirm === 'wearing' ? 'wearing' : 'not_wearing';
  } catch (e) {
    console.warn('[Eyewear Vision] 실패 → 미착용 기본값:', e);
    return 'not_wearing';
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
    'NO GLASSES',
    'ABSOLUTELY NO eyeglasses NO spectacles NO sunglasses on face',
    'bare eyes clearly visible without any eyewear frames',
    'do not add glasses under any circumstances',
    'clear face without glasses'
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
    'eyewear',
    'goggles',
  ].join(', ');
};

/** 안경 미착용: 참조 얼굴(맨눈)을 빨리 고정 / 착용: 보존 강화 */
export const getEyewearPulidAdjust = (
  state: EyewearState,
): { idWeightDelta: number; startStep: number } => {
  if (state === 'wearing') {
    return { idWeightDelta: 0.02, startStep: 2 };
  }
  return { idWeightDelta: 0.04, startStep: 2 };
};
