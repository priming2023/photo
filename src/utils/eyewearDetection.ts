/**
 * 촬영 사진에서 안경 착용 여부 추정
 *
 * 설계 원칙 (PuLID·FluxNote 문서 기반):
 *  1. 미착용자에게 안경을 씌우는 것 = 최악 → not_wearing 은 확실할 때만
 *  2. 착용자에게 안경을 제거하는 것 = 두 번째로 나쁨 → 불확실하면 참조 사진에 맡김
 *  3. PuLID는 안경·액세서리가 drift 될 수 있음 → 착용 시 명시적 프롬프트 + id_weight↑ start_step↓
 *
 * 3단계 판정:
 *  - wearing    : 안경테 신호 확실 → 적극 보존 프롬프트
 *  - not_wearing: 안경 신호 거의 없음 → 안경 추가 금지
 *  - uncertain  : 애매함·감지 실패 → 참조 사진 그대로 (네거티브 안경 금지 없음)
 */

export type EyewearState = 'wearing' | 'not_wearing' | 'uncertain';

export interface EyewearAnalysis {
  state: EyewearState;
  confidence: number;
  scores: { left: number; right: number; bridge: number; edge: number; ratio: number };
}

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

/** 가로 방향 어두운 연속선 (두꺼운 안경테) */
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
      if (lumAt(data, size, x, y) < 72) {
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

/** 수평·수직 에지 밀도 (얇은 금속테·무테 안경) */
const scoreEdgeDensity = (
  data: Uint8ClampedArray,
  size: number,
  y0: number, y1: number,
  x0: number, x1: number,
): number => {
  let edges = 0;
  const threshold = 22;
  for (let y = y0 + 1; y < y1 - 1; y++) {
    for (let x = x0 + 1; x < x1 - 1; x++) {
      const c = lumAt(data, size, x, y);
      const h = Math.abs(c - lumAt(data, size, x + 1, y));
      const v = Math.abs(c - lumAt(data, size, x, y + 1));
      if (h > threshold || v > threshold) edges++;
    }
  }
  return edges;
};

export const analyzeEyewear = (img: HTMLImageElement): EyewearAnalysis => {
  const size = 320;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    return {
      state: 'uncertain',
      confidence: 0,
      scores: { left: 0, right: 0, bridge: 0, edge: 0, ratio: 0 },
    };
  }

  ctx.drawImage(img, 0, 0, size, size);
  const data = ctx.getImageData(0, 0, size, size).data;

  const yStart = Math.floor(size * 0.28);
  const yEnd   = Math.floor(size * 0.52);

  const leftScore = scoreFrameLines(
    data, size, yStart, yEnd,
    Math.floor(size * 0.14), Math.floor(size * 0.44),
  );
  const rightScore = scoreFrameLines(
    data, size, yStart, yEnd,
    Math.floor(size * 0.56), Math.floor(size * 0.86),
  );
  const bridgeScore = scoreFrameLines(
    data, size, yStart, yEnd,
    Math.floor(size * 0.40), Math.floor(size * 0.60),
  );
  const cheekScore = scoreFrameLines(
    data, size,
    Math.floor(size * 0.52), Math.floor(size * 0.70),
    Math.floor(size * 0.18), Math.floor(size * 0.82),
  );

  const leftEdge = scoreEdgeDensity(
    data, size, yStart, yEnd,
    Math.floor(size * 0.14), Math.floor(size * 0.44),
  );
  const rightEdge = scoreEdgeDensity(
    data, size, yStart, yEnd,
    Math.floor(size * 0.56), Math.floor(size * 0.86),
  );
  const edgeScore = leftEdge + rightEdge;

  const eyeTotal = leftScore + rightScore + bridgeScore * 0.6;
  const ratio = eyeTotal / Math.max(cheekScore, 1);
  const scores = { left: leftScore, right: rightScore, bridge: bridgeScore, edge: edgeScore, ratio };

  const balancedFrames = leftScore > 22 && rightScore > 22;
  const hasBridge = bridgeScore > 12;
  const strongLineSignal = balancedFrames && hasBridge && (eyeTotal > 75 || ratio > 1.6);
  const strongEdgeSignal = leftEdge > 180 && rightEdge > 180 && hasBridge;
  const strongWearing = strongLineSignal || strongEdgeSignal;

  const strongNotWearing =
    eyeTotal < 35 &&
    ratio < 1.15 &&
    leftScore < 18 &&
    rightScore < 18 &&
    bridgeScore < 10 &&
    edgeScore < 200;

  let state: EyewearState;
  let confidence: number;

  if (strongWearing) {
    state = 'wearing';
    confidence = Math.min(100, Math.round(eyeTotal / 2 + edgeScore / 15));
  } else if (strongNotWearing) {
    state = 'not_wearing';
    confidence = Math.min(100, Math.round(40 - eyeTotal));
  } else {
    state = 'uncertain';
    confidence = 50;
  }

  const label = state === 'wearing' ? '✅착용' : state === 'not_wearing' ? '❌미착용' : '❓불확실';
  console.log(
    `[Eyewear] L=${leftScore} R=${rightScore} B=${bridgeScore} E=${edgeScore} ` +
    `ratio=${ratio.toFixed(2)} conf=${confidence} → ${label}`,
  );

  return { state, confidence, scores };
};

export const detectEyewear = async (imageSrc: string): Promise<EyewearState> => {
  try {
    const img = await loadImage(imageSrc);
    return analyzeEyewear(img).state;
  } catch (e) {
    console.warn('[Eyewear] 감지 실패 → 불확실(참조 사진 따름):', e);
    return 'uncertain';
  }
};

export const getEyewearPrompt = (state: EyewearState): string => {
  if (state === 'wearing') {
    return [
      'wearing eyeglasses on face with visible glasses frames',
      'same eyeglasses as reference photo identical frame shape color thickness and position',
      'glasses must remain on face preserve eyewear exactly do not remove or alter glasses',
    ].join(', ');
  }
  if (state === 'not_wearing') {
    return [
      'no eyeglasses on face bare eyes',
      'do not add glasses spectacles sunglasses or any eyewear',
    ].join(', ');
  }
  return [
    'preserve exact eyewear from reference photo',
    'keep glasses on face if reference shows glasses keep bare eyes if reference shows no glasses',
    'do not add or remove eyeglasses',
  ].join(', ');
};

export const getEyewearNegative = (state: EyewearState): string => {
  if (state === 'wearing') {
    return [
      'removing glasses',
      'no eyeglasses',
      'bare eyes without glasses',
      'different glasses style',
      'wrong frame color',
      'sunglasses replacing glasses',
    ].join(', ');
  }
  if (state === 'not_wearing') {
    return [
      'eyeglasses',
      'glasses',
      'spectacles',
      'sunglasses',
      'reading glasses',
      'wire-rim glasses',
      'rimless glasses',
      'adding eyewear',
      'wearing glasses',
    ].join(', ');
  }
  return '';
};

/** 착용·불확실 시 PuLID 참조 충실도 보정 (공식: start_step↓ = ID fidelity↑) */
export const getEyewearPulidAdjust = (
  state: EyewearState,
): { idWeightBoost: number; startStepReduce: number } => {
  if (state === 'wearing') {
    return { idWeightBoost: 0.03, startStepReduce: 1 };
  }
  if (state === 'uncertain') {
    return { idWeightBoost: 0.01, startStepReduce: 0 };
  }
  return { idWeightBoost: 0, startStepReduce: 0 };
};
