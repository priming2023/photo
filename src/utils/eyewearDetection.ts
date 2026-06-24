/**
 * 촬영 사진에서 안경 착용 여부 추정
 *
 * 원칙: 미착용자에게 안경을 씌우는 것이 최악의 결과
 *  → 확실히 안경테가 보일 때만 'wearing', 그 외 전부 'not_wearing'
 *  → 'wearing' 프롬프트도 "착용"을 억지로 추가하지 않고 참조 사진만 따름
 */

export type EyewearState = 'wearing' | 'not_wearing';

const loadImage = (src: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('이미지 로드 실패'));
    img.src = src;
  });

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
      const i = (y * size + x) * 4;
      const lum = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
      if (lum < 65) {
        run++;
      } else {
        if (run >= 10) score += run;
        run = 0;
      }
    }
    if (run >= 10) score += run;
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

  const yStart = Math.floor(size * 0.32);
  const yEnd   = Math.floor(size * 0.50);

  const leftScore = scoreFrameLines(
    data, size, yStart, yEnd,
    Math.floor(size * 0.15), Math.floor(size * 0.40),
  );
  const rightScore = scoreFrameLines(
    data, size, yStart, yEnd,
    Math.floor(size * 0.60), Math.floor(size * 0.85),
  );
  const bridgeScore = scoreFrameLines(
    data, size, yStart, yEnd,
    Math.floor(size * 0.43), Math.floor(size * 0.57),
  );

  const eyeTotal = leftScore + rightScore + bridgeScore;
  const symmetry = Math.min(leftScore, rightScore) / Math.max(leftScore, rightScore, 1);

  // 매우 엄격: 양쪽 대칭 + 브릿지 + 높은 점수 모두 필요
  const wearing =
    leftScore > 55 &&
    rightScore > 55 &&
    bridgeScore > 22 &&
    eyeTotal > 200 &&
    symmetry > 0.55;

  console.log(
    `[Eyewear] L=${leftScore} R=${rightScore} B=${bridgeScore} ` +
    `sym=${symmetry.toFixed(2)} → ${wearing ? '✅착용' : '❌미착용'}`,
  );
  return wearing ? 'wearing' : 'not_wearing';
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
    // 참조에 있을 때만 유지 — "wearing glasses" 억지 추가 금지
    return (
      'if reference photo shows eyeglasses, preserve identical frames only, ' +
      'do not add glasses if reference has bare eyes'
    );
  }
  return (
    'bare eyes with no eyewear, absolutely no glasses, no spectacles, ' +
    'no sunglasses, clear eyes without any frames'
  );
};

export const getEyewearNegative = (state: EyewearState): string => {
  if (state === 'wearing') {
    return 'wrong glasses style, oversized glasses frames';
  }
  return (
    'eyeglasses, glasses, spectacles, reading glasses, sunglasses, ' +
    'wire-rim glasses, rimless glasses, thick-frame glasses, ' +
    'framed glasses, adding eyewear, wearing glasses, glass lenses on face'
  );
};
