/**
 * 촬영 사진 속 인물의 연령대 추정 (canvas 피부 매끄러움 분석)
 *
 * 포토부스 주 이용층 = 어린이
 *  - 불확실·감지 실패 시 어린이로 처리
 *  - 임계값은 보수적으로(넓게) — 성인 오탐보다 어린이 미탐이 더 문제
 */

export type SubjectAgeCategory = 'child' | 'adult';

/** 피부 분산 임계값 — 이 값 미만이면 어린이 (값을 올릴수록 어린이 판정 넓어짐) */
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

export interface ChildPulidAdjust {
  idWeightDelta: number;
  startStep: number;
  minIdWeight: number;
}

/**
 * 어린이 → 목표 나이 변환 시 PuLID 보정
 * id_weight를 더 낮춰 어린이 얼굴 고정을 풀고, start_step을 올려 성인 구조 반영
 */
export const getChildPulidAdjust = (targetAgeStr: string): ChildPulidAdjust => {
  const age = parseInt(targetAgeStr.replace(/[^0-9]/g, ''), 10) || 35;

  if (age <= 25) {
    return { idWeightDelta: -0.14, startStep: 4, minIdWeight: 0.76 };
  }
  if (age <= 35) {
    return { idWeightDelta: -0.11, startStep: 4, minIdWeight: 0.78 };
  }
  if (age <= 45) {
    return { idWeightDelta: -0.07, startStep: 3, minIdWeight: 0.80 };
  }
  return { idWeightDelta: -0.04, startStep: 3, minIdWeight: 0.82 };
};

const ADULT_BONE_STRUCTURE =
  'fully mature adult Korean facial bone structure, pronounced adult jawline and chin, ' +
  'adult nose bridge, adult cheekbones, longer adult face proportions, grown-up head size';

/**
 * 어린이(약 7~12세) 촬영 → 목표 나이로 성장 변환 프롬프트
 * 10대 어린이는 목표보다 더 성인처럼 보이도록 강하게 표현
 */
export const getChildGrowthPrompt = (targetAgeStr: string): string => {
  const age = parseInt(targetAgeStr.replace(/[^0-9]/g, ''), 10) || 35;

  const noChild =
    'NOT a child face NOT baby features NOT toddler NOT infant NOT round baby cheeks ' +
    'NOT chubby child cheeks NOT schoolchild appearance NOT kindergarten age';

  if (age <= 25) {
    return [
      'CRITICAL: transform a young child into a clearly grown 25-year-old Korean adult',
      'must look solidly mid-twenties NOT teenager NOT adolescent NOT 18 years old',
      ADULT_BONE_STRUCTURE,
      noChild,
      'mature adult woman or man in their twenties with fully developed face',
    ].join(', ');
  }

  if (age <= 35) {
    return [
      'CRITICAL: transform a young child into a clearly grown 35-year-old Korean adult',
      'must look solidly in mid-thirties NOT twenties NOT teenager NOT young adult',
      ADULT_BONE_STRUCTURE,
      noChild,
      'confident mature adult in their thirties with fully developed adult features',
    ].join(', ');
  }

  if (age <= 45) {
    return [
      'Transform young child into a 45-year-old Korean adult with clear middle-aged appearance',
      ADULT_BONE_STRUCTURE,
      noChild,
      'visible mature adult features appropriate for mid-forties',
    ].join(', ');
  }

  return [
    'Transform young child into significantly older Korean adult at target age',
    ADULT_BONE_STRUCTURE,
    noChild,
  ].join(', ');
};

/** 어린이 촬영 시 목표 나이를 더 확실히 맞추는 추가 묘사 */
export const getChildAgeBoost = (targetAgeStr: string, gender: string): string => {
  const age = parseInt(targetAgeStr.replace(/[^0-9]/g, ''), 10) || 35;
  const eng = gender === '여자' ? 'woman' : 'man';

  if (age <= 25) {
    return `appears exactly 25 years old Korean ${eng}, clearly adult not teen, not childlike`;
  }
  if (age <= 35) {
    return `appears exactly 35 years old Korean ${eng}, clearly mature adult not in twenties`;
  }
  if (age <= 45) {
    return `appears exactly 45 years old Korean ${eng}, clearly middle-aged adult`;
  }
  return `appears exactly ${age} years old Korean ${eng}, fully grown adult`;
};

/** 어린이 촬영 시 네거티브 — 유아·아동 얼굴 강력 차단 */
export const getChildNegativePrompt = (targetAgeStr: string): string => {
  const age = parseInt(targetAgeStr.replace(/[^0-9]/g, ''), 10) || 35;

  const base = [
    'baby face',
    'child face',
    'toddler',
    'infant',
    'chubby round cheeks',
    'schoolchild',
    'preteen',
    'kindergarten age',
    'juvenile features',
    'child proportions',
    'doll-like child face',
    'elementary school student appearance',
  ].join(', ');

  if (age <= 25) {
    return `${base}, teenager, adolescent, looks 15 years old, looks 18 years old, too young for twenties, teenage girl, teenage boy`;
  }
  if (age <= 35) {
    return `${base}, teenager, looks 20 years old, looks 22 years old, too young for thirties, young adult in twenties`;
  }
  return `${base}, childlike adult`;
};

/** @deprecated getChildPulidAdjust 사용 */
export const getChildAgeWeightAdjust = (targetAgeStr: string): number =>
  getChildPulidAdjust(targetAgeStr).idWeightDelta;
