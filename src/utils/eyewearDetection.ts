/**
 * 촬영 사진에서 안경 착용 여부 추정
 *
 * 원칙:
 *  - 미착용자에게 안경 추가 = 최악 → 착용은 매우 확실할 때만
 *  - 그 외(불확실·미착용) → 안경 추가 금지 프롬프트 적용
 */

export type EyewearState = 'wearing' | 'not_wearing';

const loadImage = (src: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('이미지 로드 실패'));
    img.src = src;
  });

const lumAt = (data: Uint8ClampedArray, size: number, x: number, y: number): number => {
  const i = (y * size + x) * 4;
  return 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
};

const scoreFrameLines = (
  data: Uint8ClampedArray,
  size: number,
  y0: number, y1: number,
  x0: number, x1: number,
): number => {
  let score = 0;
  for (let y = y0; y < y1; y++) {
    let run = 0;
    for (let x = x0; x < x1; x++) {
      if (lumAt(data, size, x, y) < 70) {
        run++;
      } else if (run >= 8) {
        score += run;
        run = 0;
      } else {
        run = 0;
      }
    }
    if (run >= 8) score += run;
  }
  return score;
};

const analyzeEyewear = (img: HTMLImageElement): EyewearState => {
  const size = 320;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return 'not_wearing';

  ctx.drawImage(img, 0, 0, size, size);
  const data = ctx.getImageData(0, 0, size, size).data;

  const yStart = Math.floor(size * 0.30);
  const yEnd   = Math.floor(size * 0.50);

  const leftScore = scoreFrameLines(
    data, size, yStart, yEnd,
    Math.floor(size * 0.15), Math.floor(size * 0.42),
  );
  const rightScore = scoreFrameLines(
    data, size, yStart, yEnd,
    Math.floor(size * 0.58), Math.floor(size * 0.85),
  );
  const bridgeScore = scoreFrameLines(
    data, size, yStart, yEnd,
    Math.floor(size * 0.42), Math.floor(size * 0.58),
  );
  const cheekScore = scoreFrameLines(
    data, size,
    Math.floor(size * 0.54), Math.floor(size * 0.68),
    Math.floor(size * 0.20), Math.floor(size * 0.80),
  );

  const eyeTotal = leftScore + rightScore + bridgeScore;
  const ratio = eyeTotal / Math.max(cheekScore, 1);
  const symmetry = Math.min(leftScore, rightScore) / Math.max(leftScore, rightScore, 1);

  // 착용: 양쪽 대칭 + 브릿지 + 높은 점수 모두 필요 (오탐 최소화)
  const wearing =
    leftScore > 40 &&
    rightScore > 40 &&
    bridgeScore > 18 &&
    eyeTotal > 130 &&
    ratio > 1.8 &&
    symmetry > 0.6;

  console.log(
    `[Eyewear] L=${leftScore} R=${rightScore} B=${bridgeScore} ` +
    `ratio=${ratio.toFixed(2)} sym=${symmetry.toFixed(2)} → ${wearing ? '✅착용' : '❌미착용'}`,
  );
  return wearing ? 'wearing' : 'not_wearing';
};

export const detectEyewear = async (imageSrc: string): Promise<EyewearState> => {
  try {
    const img = await loadImage(imageSrc);
    return analyzeEyewear(img);
  } catch (e) {
    console.warn('[Eyewear] 감지 실패 → 미착용 처리:', e);
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
    'bare eyes with no eyewear',
    'no eyeglasses no spectacles no sunglasses on face',
    'do not add any glasses or eyewear',
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
    'adding eyewear',
    'wearing glasses',
  ].join(', ');
};

export const getEyewearPulidAdjust = (
  state: EyewearState,
): { idWeightBoost: number; startStepReduce: number } => {
  if (state === 'wearing') {
    return { idWeightBoost: 0.02, startStepReduce: 1 };
  }
  return { idWeightBoost: 0, startStepReduce: 0 };
};
