/**
 * 촬영 사진 속 인물의 연령대 추정 (canvas 피부 매끄러움 분석)
 */

import { parseAgeNumber } from './ageDescriptors';

export type SubjectAgeCategory = 'child' | 'adult';

const MAX_RENDER_AGE = 65;

const loadImage = (src: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('이미지 로드 실패'));
    img.src = src;
  });

const computeSkinVariance = (
  data: Uint8ClampedArray,
  size: number,
  y0: number, y1: number,
  x0: number, x1: number,
): number => {
  let total = 0;
  let count = 0;

  const lum = (x: number, y: number): number => {
    const i = (y * size + x) * 4;
    return 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
  };

  for (let y = y0; y < y1 - 1; y++) {
    for (let x = x0; x < x1 - 1; x++) {
      const c = lum(x, y);
      total += Math.abs(c - lum(x + 1, y)) + Math.abs(c - lum(x, y + 1));
      count += 2;
    }
  }

  return count > 0 ? total / count : 15;
};

const analyzeSubjectAge = (img: HTMLImageElement): SubjectAgeCategory => {
  const size = 320;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return 'adult';

  ctx.drawImage(img, 0, 0, size, size);
  const data = ctx.getImageData(0, 0, size, size).data;

  const leftCheek = computeSkinVariance(
    data, size,
    Math.floor(size * 0.40), Math.floor(size * 0.65),
    Math.floor(size * 0.12), Math.floor(size * 0.38),
  );
  const rightCheek = computeSkinVariance(
    data, size,
    Math.floor(size * 0.40), Math.floor(size * 0.65),
    Math.floor(size * 0.62), Math.floor(size * 0.88),
  );
  const forehead = computeSkinVariance(
    data, size,
    Math.floor(size * 0.15), Math.floor(size * 0.30),
    Math.floor(size * 0.30), Math.floor(size * 0.70),
  );

  const avgVariance = (leftCheek + rightCheek + forehead * 1.2) / 3.2;
  const isChild = avgVariance < 9;

  console.log(
    `[SubjectAge] 뺨L=${leftCheek.toFixed(1)} 뺨R=${rightCheek.toFixed(1)} ` +
    `이마=${forehead.toFixed(1)} 평균=${avgVariance.toFixed(1)} ` +
    `→ ${isChild ? '👶어린이' : '🧑성인'}`,
  );

  return isChild ? 'child' : 'adult';
};

export const detectSubjectAge = async (imageSrc: string): Promise<SubjectAgeCategory> => {
  try {
    const img = await loadImage(imageSrc);
    return analyzeSubjectAge(img);
  } catch (e) {
    console.warn('[SubjectAge] 감지 실패, 성인으로 처리:', e);
    return 'adult';
  }
};

/**
 * AI 변환 표현 나이
 * - 성인 판정: 선택 나이 그대로
 * - 어린이 판정: 기본적으로 +15살을 더해 확실히 나이 들게 표현 (25살 선택 → 40살 묘사)
 *   단, 선택 나이가 35세 이상이면 너무 늙어 보이지 않게 보정폭을 줄임 (+10살, +5살)
 * - 영수증·UI는 선택 나이 유지
 */
export const getEffectiveAgeStr = (
  selectedAgeStr: string,
  subjectAge: SubjectAgeCategory,
): string => {
  if (subjectAge !== 'child') return selectedAgeStr;

  const selected = parseAgeNumber(selectedAgeStr);
  
  let offset = 15;
  if (selected >= 45) {
    offset = 5;
  } else if (selected >= 35) {
    offset = 10;
  }

  const adjusted = Math.min(selected + offset, MAX_RENDER_AGE);
  return `${adjusted}살`;
};

/** 어린이 감지 시 PuLID id_weight 보정 (얼굴 골격을 바꾸기 위해 대폭 낮춤) */
export const getChildAgeWeightAdjust = (targetAgeStr: string): number => {
  const age = parseAgeNumber(targetAgeStr);
  if (age <= 40) return -0.35; // 기존 -0.22에서 대폭 하향 (아이 얼굴형 완전 타파)
  if (age <= 50) return -0.25;
  if (age <= 60) return -0.15;
  return -0.10;
};

/** 어린이 감지 시 PuLID start_step 지연 (어른 형태를 먼저 잡고 나중에 얼굴 합성) */
export const getChildStartStepAdjust = (targetAgeStr: string): number => {
  const age = parseAgeNumber(targetAgeStr);
  if (age <= 40) return 5; // 기존 3에서 증가
  if (age <= 50) return 4;
  return 3;
};

/** 어린이 감지 시 성장 변환 문구 (targetAgeStr = effectiveAge, 이미 offset 반영) */
export const getChildGrowthPrompt = (targetAgeStr: string): string => {
  const age = parseAgeNumber(targetAgeStr);

  if (age <= 40) {
    return (
      'Completely transform this child into a fully mature adult Korean. ' +
      'ABSOLUTELY NO CHILD FEATURES. Complete loss of baby fat, sharp adult jawline, elongated adult face shape, ' +
      'mature adult bone structure and adult facial proportions. ' +
      'Prominent adult cheekbones, adult eye socket depth, full adult maturity.'
    );
  }
  if (age <= 50) {
    return (
      'Completely transform childhood features into a mature adult appearance. ' +
      'Fully developed adult Korean face, sharp adult jawline, loss of baby fat, ' +
      'adult bone structure, grown-up facial proportions — absolutely no childlike features.'
    );
  }
  return (
    'Transform from child to significantly older adult. ' +
    'Fully grown adult Korean face with age-appropriate features, strong adult jawline.'
  );
};
