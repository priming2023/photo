/**
 * 촬영 사진에서 안경 착용 여부 추정 (canvas 휴리스틱)
 *
 * 설계 원칙:
 *  - 안경 미착용자에게 안경을 씌우는 것이 가장 나쁜 결과
 *  - 따라서 "확실히 착용" 아니면 무조건 미착용 처리 (strict threshold)
 *  - uncertain 상태 제거 → 항상 명확한 네거티브 프롬프트 적용
 *
 * 판정 기준:
 *  - 양쪽 눈 영역에 가로 방향 어두운 선(안경테)이 모두 존재해야 함
 *  - 코 다리(브릿지) 구간에도 어두운 선이 있어야 함
 *  - 임계값을 높게 유지해 눈썹·그림자 오탐 방지
 */

export type EyewearState = 'wearing' | 'not_wearing';

const loadImage = (src: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('이미지 로드 실패'));
    img.src = src;
  });

/**
 * 지정 영역에서 가로 방향으로 연속된 어두운 픽셀(안경테 특성) 점수 계산
 * run >= 8: 눈썹(짧고 곡선)과 안경테(길고 수평) 구분 강화
 */
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
      if (lum < 70) {
        run++;
      } else {
        if (run >= 8) score += run;
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

  // 눈 영역: 상반신 인물 사진 기준 y 30~52%
  const yStart = Math.floor(size * 0.30);
  const yEnd   = Math.floor(size * 0.52);

  // 왼쪽 렌즈 영역
  const leftScore = scoreFrameLines(
    data, size, yStart, yEnd,
    Math.floor(size * 0.15), Math.floor(size * 0.42),
  );
  // 오른쪽 렌즈 영역
  const rightScore = scoreFrameLines(
    data, size, yStart, yEnd,
    Math.floor(size * 0.58), Math.floor(size * 0.85),
  );
  // 코 브릿지 영역 — 안경은 여기 선이 반드시 있음
  const bridgeScore = scoreFrameLines(
    data, size, yStart, yEnd,
    Math.floor(size * 0.42), Math.floor(size * 0.58),
  );
  // 뺨 영역 (기준선 — 전체적으로 어두운 사진과 구분)
  const cheekScore = scoreFrameLines(
    data, size,
    Math.floor(size * 0.54), Math.floor(size * 0.70),
    Math.floor(size * 0.20), Math.floor(size * 0.80),
  );

  const eyeTotal = leftScore + rightScore + bridgeScore;
  const ratio    = eyeTotal / Math.max(cheekScore, 1);

  // 판정 조건 (모두 충족해야 착용):
  //  1. 양쪽 모두 충분한 선이 있어야 (비대칭 → 안경 아닐 가능성 높음)
  //  2. 브릿지 존재 확인
  //  3. 뺨 대비 눈 영역 선 밀도가 높아야 (전체적으로 어두운 사진 오탐 방지)
  const hasFrame  = leftScore > 35 && rightScore > 35;
  const hasBridge = bridgeScore > 15;
  const clearSignal = eyeTotal > 120 || ratio > 2.2;

  const wearing = hasFrame && hasBridge && clearSignal;

  console.log(
    `[Eyewear] left=${leftScore} right=${rightScore} bridge=${bridgeScore} ` +
    `ratio=${ratio.toFixed(2)} → ${wearing ? '✅착용' : '❌미착용'}`,
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
    return (
      'wearing the same eyeglasses as in the reference photo, ' +
      'identical glasses frame shape color thickness and style, ' +
      'preserve eyewear exactly — do not remove or alter glasses'
    );
  }
  return (
    'no eyeglasses on face, bare eyes, ' +
    'do not add any glasses spectacles sunglasses or eyewear of any kind'
  );
};

export const getEyewearNegative = (state: EyewearState): string => {
  if (state === 'wearing') {
    return (
      'removing glasses, no eyeglasses, bare eyes without glasses, ' +
      'different glasses style, wrong frame color, sunglasses instead of glasses'
    );
  }
  // 미착용: 안경 관련 모든 표현 차단
  return (
    'eyeglasses, glasses, spectacles, reading glasses, sunglasses, ' +
    'wire-rim glasses, rimless glasses, thick-frame glasses, ' +
    'framed glasses, adding eyewear, wearing glasses'
  );
};
