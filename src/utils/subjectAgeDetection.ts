/**
 * 촬영 사진 속 인물의 연령대 추정 (canvas 피부 매끄러움 분석)
 *
 * 포토부스 주 이용층 = 어린이
 *  - 불확실·감지 실패 시 어린이로 처리
 */

import { parseAgeNumber } from './ageDescriptors';

export type SubjectAgeCategory = 'child' | 'adult';

/** 어린이로 판정 시 AI 표현 나이에 더하는 값 (선택 나이 + 15살) */
export const CHILD_APPEARANCE_AGE_OFFSET = 15;

const MAX_RENDER_AGE = 65;
const AGE_TIERS = [25, 35, 45, 55, 65] as const;
const CHILD_VARIANCE_THRESHOLD = 11;

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
  if (!ctx) return 'child';

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
  const isChild = avgVariance < CHILD_VARIANCE_THRESHOLD;

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
    console.warn('[SubjectAge] 감지 실패 → 어린이로 처리 (포토부스 기본):', e);
    return 'child';
  }
};

export const formatAgeStr = (age: number): string => `${age}살`;

/** 중간 나이(예: 40)를 아래가 아닌 위 구간(45)으로 스냅 — 어린이 표현이 실제로 더 들어 보이게 */
const snapAgeUp = (age: number): number => {
  const tier = AGE_TIERS.find((k) => k >= age);
  return tier ?? MAX_RENDER_AGE;
};

/**
 * AI 변환에 쓸 실제 표현 나이
 * - 성인: 사용자가 선택한 나이 그대로 (남녀 동일)
 * - 어린이: 선택 나이 + 15살 → 위 구간으로 스냅 (최대 65살, 남녀 동일)
 *
 * 예) 어린이 + 25살 선택 → 40 → 45살 표현
 *     어린이 + 35살 선택 → 50 → 55살 표현
 *
 * 영수증·UI 라벨은 선택 나이(selectedAgeStr)를 그대로 표시
 */
export const getEffectiveAgeStr = (
  selectedAgeStr: string,
  subjectAge: SubjectAgeCategory,
): string => {
  if (subjectAge !== 'child') return selectedAgeStr;

  const selected = parseAgeNumber(selectedAgeStr);
  const raw = Math.min(selected + CHILD_APPEARANCE_AGE_OFFSET, MAX_RENDER_AGE);
  return formatAgeStr(snapAgeUp(raw));
};

export interface ChildPulidAdjust {
  idWeightDelta: number;
  startStep: number;
  minIdWeight: number;
}

/** 어린이 참조 사진 → 성인 표현 시 PuLID 보정 (effectiveAge 기준) */
export const getChildPulidAdjust = (effectiveAgeStr: string): ChildPulidAdjust => {
  const age = parseAgeNumber(effectiveAgeStr);

  if (age <= 35) {
    return { idWeightDelta: -0.10, startStep: 4, minIdWeight: 0.78 };
  }
  if (age <= 45) {
    return { idWeightDelta: -0.06, startStep: 3, minIdWeight: 0.82 };
  }
  return { idWeightDelta: -0.04, startStep: 2, minIdWeight: 0.84 };
};

/** 어린이 참조 → effectiveAge 성인으로 성장 (effectiveAge는 +15·상향 스냅 반영) */
export const getChildGrowthPrompt = (effectiveAgeStr: string): string => {
  const age = parseAgeNumber(effectiveAgeStr);
  return [
    `Transform young child into a fully grown ${age}-year-old Korean adult`,
    'mature adult jaw nose bridge and cheekbones, fully grown face',
    'NOT child face NOT baby features NOT toddler NOT round baby cheeks',
  ].join(', ');
};

/** 어린이 촬영 시 유아·아동 얼굴 차단 (effectiveAge 기준) */
export const getChildNegativePrompt = (effectiveAgeStr: string): string => {
  const age = parseAgeNumber(effectiveAgeStr);

  const base = [
    'baby face',
    'child face',
    'toddler',
    'infant',
    'chubby round cheeks',
    'schoolchild',
    'kindergarten age',
    'juvenile features',
  ].join(', ');

  if (age <= 35) {
    return `${base}, teenager, adolescent, too young, looks under ${age - 5} years old`;
  }
  if (age <= 45) {
    return `${base}, teenager, looks in twenties, too young for forties`;
  }
  return `${base}, childlike adult, too young for age`;
};
