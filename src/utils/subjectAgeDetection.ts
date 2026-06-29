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
  _gender: string = '남자',
): string => {
  const selected = parseAgeNumber(selectedAgeStr);
  
  if (subjectAge !== 'child') {
    // 성인이라도 남자가 50세(구 55세), 60세(구 65세)를 선택하면 조금 덜 늙어 보이게 오프셋을 줌
    if (_gender === '남자') {
      if (selected === 50) return '47살';
      if (selected === 60) return '55살';
    }
    return selectedAgeStr;
  }

  let offset = 0;
  if (selected === 30) {
    offset = 15; // 구 35세 남자 타겟: 30+15=45 (과거 35세의 타겟 45와 동일하게 맞춤)
  } else if (selected === 40) {
    offset = 10; // 구 45세 타겟: 40+10=50 (과거 45세의 타겟 50과 동일)
  } else if (selected === 50) {
    offset = 5;  // 구 55세 타겟: 50+5=55 (과거 55세의 타겟 55와 동일)
  } else if (selected === 60) {
    offset = 5;  // 구 65세 타겟: 60+5=65 (과거 65세의 타겟 65와 동일)
  }

  const adjusted = Math.min(selected + offset, MAX_RENDER_AGE);
  return `${adjusted}살`;
};

/**
 * 어린이 감지 시 PuLID id_weight 보정.
 * - 여자: 사용자가 만족했던 기존 수치 그대로 (절대 변경 금지)
 * - 남자: "젊은 목표일수록 약하게, 늙은 목표일수록 강하게" 변형.
 */
export const getChildAgeWeightAdjust = (targetAgeStr: string, gender: string = '남자'): number => {
  const age = parseAgeNumber(targetAgeStr);
  if (gender === '여자') {
    // 여자: 세션 전 만족했던 원래 수치 그대로 유지되도록 타겟 구간 조정
    if (age <= 30) return -0.40;
    if (age <= 50) return -0.35; // 구 35(타겟45), 구 45(타겟50) 모두 -0.35 였음
    if (age <= 60) return -0.30; // 구 55(타겟55) -0.30 였음
    return -0.25;                // 구 65(타겟65) -0.25 였음
  }
  // 남자 
  if (age <= 30) return -0.40; // 구 35세 남자 타겟과 동일
  if (age <= 50) return -0.35; 
  if (age <= 60) return -0.30; 
  return -0.25;                
};

/** 어린이 감지 시 PuLID start_step 지연 (어른 형태를 먼저 잡고 나중에 얼굴 합성) */
export const getChildStartStepAdjust = (targetAgeStr: string, gender: string = '남자'): number => {
  const age = parseAgeNumber(targetAgeStr);
  if (gender === '여자') {
    // 여자: 세션 전 만족했던 원래 수치 그대로 유지
    if (age <= 30) return 6;
    if (age <= 50) return 5;
    return 4;
  }
  // 남자 
  if (age <= 30) return 6; // 구 35세 타겟과 동일하게 돌림 (어린이 감지 시 강력 변형)
  if (age <= 50) return 5; 
  return 4;
};

/** 어린이 감지 시 성장 변환 문구 (targetAgeStr = effectiveAge, 이미 offset 반영) */
export const getChildGrowthPrompt = (targetAgeStr: string, gender: string = '남자'): string => {
  const age = parseAgeNumber(targetAgeStr);

  if (age <= 30) {
    if (gender === '여자') {
      return (
        'Completely transform this child into a fully mature adult Korean. ' +
        'ABSOLUTELY NO CHILD FEATURES. Complete loss of baby fat, sharp adult jawline, elongated adult face shape, ' +
        'mature adult bone structure and adult facial proportions. ' +
        'Prominent adult cheekbones, adult eye socket depth, full adult maturity.'
      );
    }
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
