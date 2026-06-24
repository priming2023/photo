/**
 * 이미지 → 박스 맞춤 — 영수증 캔버스 공통
 */

export interface CoverYBiasOptions {
  /** 박스 높이 대비 아래로 이동 */
  yBias?: number;
  /** 1 = 꽉 참, 낮을수록 줌아웃(몸이 더 보임) */
  widthScale?: number;
}

export interface FrameFitRect {
  drawX: number;
  drawY: number;
  drawW: number;
  drawH: number;
}

/** 영수증 — AI 미래 사진 (aafc26b 기준, 살짝만 줌아웃) */
export const FUTURE_PHOTO_COVER: CoverYBiasOptions = { yBias: 0.13, widthScale: 0.84 };

/** 영수증 — 웹캠 현재 사진 (미래보다 더 넓게) */
export const CURRENT_PHOTO_COVER: CoverYBiasOptions = { yBias: 0.08, widthScale: 0.81 };

/**
 * cover + yBias + widthScale — aafc26b 검증 방식
 * 가로를 채우고 widthScale로만 미세 줌아웃
 */
export const computeCoverYBiasFit = (
  imgW: number,
  imgH: number,
  boxX: number,
  boxY: number,
  boxW: number,
  boxH: number,
  { yBias = 0.07, widthScale = 1 }: CoverYBiasOptions = {},
): FrameFitRect => {
  const imgAspect = imgW / imgH;
  const boxAspect = boxW / boxH;
  const scale = widthScale;
  let drawW: number;
  let drawH: number;
  let drawX: number;
  let drawY: number;

  if (imgAspect > boxAspect) {
    drawH = boxH * scale;
    drawW = imgW * (drawH / imgH);
    drawX = boxX + (boxW - drawW) / 2;
    drawY = boxY + (boxH - drawH) / 2 + boxH * yBias * 0.5;
  } else {
    drawW = boxW * scale;
    drawH = imgH * (drawW / imgW);
    drawX = boxX + (boxW - drawW) / 2;
    drawY = boxY + (boxH - drawH) / 2 + boxH * yBias;
  }

  return { drawX, drawY, drawW, drawH };
};
