/**
 * 촬영 사진에서 안경 착용 여부 추정 (브라우저 canvas 휴리스틱)
 *
 * PuLID가 참조 이미지를 쓰지만, 직업 프롬프트·네거티브가 안경을 덮어쓸 수 있어
 * 사전 감지 후 프롬프트를 분기합니다.
 */

export type EyewearState = 'wearing' | 'not_wearing' | 'uncertain';

const loadImage = (src: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('이미지 로드 실패'));
    img.src = src;
  });

/** 눈 주변 가로 방향 어두운 선(안경테) 밀도 측정 */
const scoreEyeFrameLines = (
  data: Uint8ClampedArray,
  size: number,
  y0: number,
  y1: number,
  x0: number,
  x1: number,
): number => {
  const isDark = (x: number, y: number): boolean => {
    const i = (y * size + x) * 4;
    const lum = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    return lum < 75;
  };

  let score = 0;
  for (let y = y0; y < y1; y++) {
    let run = 0;
    for (let x = x0; x < x1; x++) {
      if (isDark(x, y)) {
        run++;
      } else if (run >= 6) {
        score += run;
        run = 0;
      } else {
        run = 0;
      }
    }
    if (run >= 6) score += run;
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

  // 눈 영역 (상반신 인물 사진 기준)
  const yStart = Math.floor(size * 0.30);
  const yEnd = Math.floor(size * 0.50);

  const leftScore = scoreEyeFrameLines(
    data, size, yStart, yEnd,
    Math.floor(size * 0.15), Math.floor(size * 0.43),
  );
  const rightScore = scoreEyeFrameLines(
    data, size, yStart, yEnd,
    Math.floor(size * 0.57), Math.floor(size * 0.85),
  );
  const bridgeScore = scoreEyeFrameLines(
    data, size, yStart, yEnd,
    Math.floor(size * 0.40), Math.floor(size * 0.60),
  );

  // 볼 영역 (비교용 — 안경 없으면 눈·볼 점수 비슷)
  const cheekScore = scoreEyeFrameLines(
    data, size,
    Math.floor(size * 0.52), Math.floor(size * 0.68),
    Math.floor(size * 0.20), Math.floor(size * 0.80),
  );

  const eyeTotal = leftScore + rightScore + bridgeScore * 0.5;
  const ratio = eyeTotal / Math.max(cheekScore, 1);

  // 양쪽 눈에 가로선이 있어야 안경으로 판정
  const balanced = leftScore > 25 && rightScore > 25;
  const strongWearing = balanced && (eyeTotal > 90 || ratio > 1.8);
  const strongNotWearing = eyeTotal < 40 && ratio < 1.2 && leftScore < 20 && rightScore < 20;

  let state: EyewearState;
  if (strongWearing) state = 'wearing';
  else if (strongNotWearing) state = 'not_wearing';
  else state = 'uncertain';

  console.log(`[Eyewear] left=${leftScore} right=${rightScore} bridge=${bridgeScore} ratio=${ratio.toFixed(2)} → ${state}`);
  return state;
};

export const detectEyewear = async (imageSrc: string): Promise<EyewearState> => {
  try {
    const img = await loadImage(imageSrc);
    return analyzeEyewear(img);
  } catch (e) {
    console.warn('[Eyewear] 감지 실패, 미착용으로 처리:', e);
    return 'not_wearing';
  }
};

export const getEyewearPrompt = (state: EyewearState): string => {
  if (state === 'wearing') {
    return [
      'wearing the same eyeglasses as in the reference photo',
      'identical glasses frame shape color thickness and position on face',
      'preserve eyewear exactly do not remove or change glasses style',
    ].join(', ');
  }
  if (state === 'not_wearing') {
    return [
      'no eyeglasses on face',
      'bare eyes clear vision',
      'do not add glasses spectacles sunglasses or any eyewear',
    ].join(', ');
  }
  return [
    'preserve eyewear exactly as in reference photo',
    'same glasses frame if present in reference',
    'no glasses if reference shows bare eyes',
  ].join(', ');
};

export const getEyewearNegative = (state: EyewearState): string => {
  if (state === 'wearing') {
    return 'removing glasses, no eyeglasses, bare eyes, different glasses, wrong frame style, sunglasses replacing glasses';
  }
  if (state === 'not_wearing') {
    return 'eyeglasses, glasses, spectacles, sunglasses, reading glasses, wire-rim glasses, rimless glasses, adding eyewear';
  }
  return '';
};
