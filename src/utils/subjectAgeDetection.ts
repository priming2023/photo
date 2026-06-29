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
  // 대부분의 사용자가 어린이이므로, 아주 주름이 깊은 노인이 아니면 모두 '어린이'로 판정하여
  // 어린이 보정 로직(골격 파괴 및 나이 오프셋)을 적용하도록 임계값을 9에서 20으로 대폭 상향
  const isChild = avgVariance < 20;

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
 * - 어린이 판정: 
 *   25세 선택 시 35세(young adult) 급으로 올려 젖살 배제
 *   35세 선택 시 45세 급으로 올려 성숙함 부여
 *   45세 이상은 조금씩만 더해 지나치게 늙어보이지 않게 방어
 * - 영수증·UI는 선택 나이 유지
 */
export const getEffectiveAgeStr = (
  selectedAgeStr: string,
  subjectAge: SubjectAgeCategory,
  gender: string = '남자',
): string => {
  const selected = parseAgeNumber(selectedAgeStr);
  
  if (subjectAge !== 'child') {
    // 성인이라도 남자가 55세, 65세를 선택하면 조금 덜 늙어 보이게 오프셋을 마이너스로 줌 (약 3~5년 젊게)
    if (gender === '남자') {
      if (selected === 55) return '52살';
      if (selected === 65) return '60살';
    }
    return selectedAgeStr;
  }

  let offset = 0;
  if (selected === 25) {
    // 25세 남자는 기존에 +15를 주었으나(40세급), 조금 더 청년의 느낌을 살리기 위해 오프셋을 +8로 조정하여 33세급으로 세팅함
    offset = gender === '남자' ? 8 : 5;
  } else if (selected === 35) {
    // 35세 선택 시 남자는 45세 급으로, 여자는 45세 급으로
    offset = gender === '남자' ? 10 : 10;
  } else if (selected === 45) {
    offset = gender === '남자' ? 5 : 5;
  } else if (selected === 55) {
    // 남자 55세 어른은 오프셋 적용 안 하고 그대로 (0) - 예전처럼 너무 늙어보이면 프롬프트에서 조절
    offset = 0;
  } else if (selected === 65) {
    // 남자 65세도 그대로 (0)
    offset = 0;
  }

  const adjusted = Math.min(selected + offset, MAX_RENDER_AGE);
  return `${adjusted}살`;
};

/** 어린이 감지 시 PuLID id_weight 보정 (얼굴 골격을 바꾸기 위해 대폭 낮춤) */
export const getChildAgeWeightAdjust = (targetAgeStr: string): number => {
  const age = parseAgeNumber(targetAgeStr);
  if (age <= 40) return -0.40; // 20~30대 타겟: 얼굴형 완벽 타파
  if (age <= 50) return -0.35; // 40대 타겟
  if (age <= 60) return -0.30; // 50대 타겟
  return -0.25;                // 60대 타겟
};

/** 어린이 감지 시 PuLID start_step 지연 (어른 형태를 먼저 잡고 나중에 얼굴 합성) */
export const getChildStartStepAdjust = (targetAgeStr: string): number => {
  const age = parseAgeNumber(targetAgeStr);
  if (age <= 40) return 6; // 매우 늦게 얼굴 합성 (골격 유지력 극대화)
  if (age <= 50) return 5;
  return 4;
};

/** 어린이 감지 시 성장 변환 문구 (targetAgeStr = effectiveAge, 이미 offset 반영) */
export const getChildGrowthPrompt = (targetAgeStr: string): string => {
  const age = parseAgeNumber(targetAgeStr);

  if (age <= 40) {
    return (
      'Completely transform this child into a young adult Korean man. ' +
      'ABSOLUTELY NO CHILD FEATURES. Complete loss of baby fat, sharp jawline, elongated adult face shape, ' +
      'handsome youthful adult proportions. ' +
      'Not middle-aged, just a fresh energetic young professional adult.'
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
