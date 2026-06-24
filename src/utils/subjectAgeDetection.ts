/**
 * 촬영 사진 속 인물의 연령대 추정 (canvas 피부 매끄러움 분석)
 *
 * 원리:
 *  어린이 피부는 성인보다 현저히 매끄럽다 (모공·주름 없음).
 *  인접 픽셀 밝기 차이의 평균(local variance)이 낮을수록 어린이.
 *  JPEG 압축 노이즈(+2~4)를 반영한 임계값 8 사용.
 *
 * 반환값:
 *  'child' — 약 12세 이하 추정 (피부 매끄러움 score < 8)
 *  'adult' — 10대 후반 이상 추정 (score >= 8)
 *
 * 설계 방침:
 *  - 어린이 오탐(성인→어린이)보다 미탐(어린이→성인)이 덜 나쁨
 *    (어린이를 성인으로 처리해도 기존 노화 프롬프트 동작)
 *  - 따라서 임계값은 보수적으로 설정 (false positive 최소화)
 *
 * 포토부스 상황:
 *  - 대부분 어린이가 찍음 → 어린이 감지가 핵심
 *  - 20대 기준으로 테스트했던 기존 설정은 어린이에게 부적절
 *  - 어린이 감지 시 id_weight 소폭 하향 + 성장 변환 프롬프트 추가
 */

export type SubjectAgeCategory = 'child' | 'adult';

const loadImage = (src: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('이미지 로드 실패'));
    img.src = src;
  });

/**
 * 지정 영역의 인접 픽셀 밝기 차이 평균 계산
 * 낮을수록 매끄러운 피부 (어린이 특성)
 */
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

  // 왼쪽 뺨: 눈썹~턱 사이, 코 왼쪽 (피부 노출 가장 많은 영역)
  const leftCheek = computeSkinVariance(
    data, size,
    Math.floor(size * 0.40), Math.floor(size * 0.65),
    Math.floor(size * 0.12), Math.floor(size * 0.38),
  );
  // 오른쪽 뺨
  const rightCheek = computeSkinVariance(
    data, size,
    Math.floor(size * 0.40), Math.floor(size * 0.65),
    Math.floor(size * 0.62), Math.floor(size * 0.88),
  );
  // 이마 (어린이 이마는 특히 매끄러움)
  const forehead = computeSkinVariance(
    data, size,
    Math.floor(size * 0.15), Math.floor(size * 0.30),
    Math.floor(size * 0.30), Math.floor(size * 0.70),
  );

  // 세 영역 평균 (이마에 약간 가중치)
  const avgVariance = (leftCheek + rightCheek + forehead * 1.2) / 3.2;

  // 임계값 9: 어린이 감지 민감도 상향 (포토부스 주 이용층 = 어린이)
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
 * 어린이 감지 시 PuLID id_weight 보정값
 * 목표 나이가 어릴수록 더 많은 변환을 허용 (id_weight 낮춤)
 * start_step은 건드리지 않음 — 닮음 붕괴 위험
 */
export const getChildAgeWeightAdjust = (targetAgeStr: string): number => {
  const age = parseInt(targetAgeStr.replace(/[^0-9]/g, ''), 10) || 35;
  if (age <= 25) return -0.06;  // 25살: 어린이→성인 변환이 가장 크게 필요
  if (age <= 35) return -0.04;  // 35살: 중간
  if (age <= 45) return -0.01;  // 45살 이상: 나이 묘사가 자연스럽게 처리
  return 0;
};

/**
 * 어린이 감지 시 프롬프트에 추가할 성장 변환 문구
 * 목표 나이별로 강도 조절
 */
export const getChildGrowthPrompt = (targetAgeStr: string): string => {
  const age = parseInt(targetAgeStr.replace(/[^0-9]/g, ''), 10) || 35;

  if (age <= 25) {
    return (
      'Transform this child into a fully grown Korean adult. ' +
      'Mature adult bone structure and facial proportions, ' +
      'completely grown up face — NOT a child face, NOT baby features. ' +
      'Adult jaw, adult nose bridge, adult eye socket depth.'
    );
  }
  if (age <= 35) {
    return (
      'Transform childhood features into mature adult appearance. ' +
      'Fully developed adult Korean face, adult bone structure, ' +
      'grown-up facial proportions — no childlike features.'
    );
  }
  // 45세 이상은 기존 나이 묘사만으로 충분
  return (
    'Transform from child to significantly older adult. ' +
    'Fully grown adult Korean face with age-appropriate features.'
  );
};
