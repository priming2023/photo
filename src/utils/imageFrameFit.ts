/**
 * 이미지 → 박스 맞춤 — 영수증 캔버스 공통
 * contain 기반: 좌우·상하 잘림 없음, widthScale로 줌아웃
 */

export interface ReceiptFitOptions {
  /** 박스 높이 대비 아래로 이동 */
  yBias?: number;
  /** 1 = 박스에 맞춤, 낮을수록 줌아웃(몸이 더 보임) */
  widthScale?: number;
}

export interface FrameFitRect {
  drawX: number;
  drawY: number;
  drawW: number;
  drawH: number;
}

/** 영수증 — AI 미래 사진 */
export const FUTURE_PHOTO_COVER: ReceiptFitOptions = { yBias: 0.12, widthScale: 0.82 };

/** 영수증 — 웹캠 현재 사진 (미래보다 더 넓게) */
export const CURRENT_PHOTO_COVER: ReceiptFitOptions = { yBias: 0.08, widthScale: 0.76 };

/**
 * contain + widthScale + yBias
 * 이미지 전체가 박스 안에 들어가므로 좌우 잘림 없음
 */
export const computeReceiptFit = (
  imgW: number,
  imgH: number,
  boxX: number,
  boxY: number,
  boxW: number,
  boxH: number,
  { yBias = 0.07, widthScale = 1 }: ReceiptFitOptions = {},
): FrameFitRect => {
  const imgAspect = imgW / imgH;
  const boxAspect = boxW / boxH;
  let drawW: number;
  let drawH: number;

  if (imgAspect > boxAspect) {
    drawW = boxW;
    drawH = imgH * (boxW / imgW);
  } else {
    drawH = boxH;
    drawW = imgW * (boxH / imgH);
  }

  const scale = Math.min(widthScale, 1);
  drawW *= scale;
  drawH *= scale;

  return {
    drawX: boxX + (boxW - drawW) / 2,
    drawY: boxY + (boxH - drawH) / 2 + boxH * yBias,
    drawW,
    drawH,
  };
};

/** @deprecated computeReceiptFit 사용 */
export const computeCoverYBiasFit = computeReceiptFit;
