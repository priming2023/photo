/**
 * 이미지 → 박스 맞춤 — Result 화면·영수증 캔버스 공통
 */

export interface CoverYBiasOptions {
  /** 박스 높이 대비 아래로 이동 (0.07 = 46bf32a 검증값) */
  yBias?: number;
  /** 가로 채움 비율 (1 = 꽉 채움) */
  widthScale?: number;
}

export type CoverVerticalAlign = 'center' | 'top' | 'upper-body';

export interface FrameFitRect {
  drawX: number;
  drawY: number;
  drawW: number;
  drawH: number;
}

/** 영수증 — AI 미래 사진 (46bf32a: cover + yBias, 좌우 여백 없음) */
export const FUTURE_PHOTO_COVER: CoverYBiasOptions = { yBias: 0.07, widthScale: 1 };

/** 영수증 — 웹캠 현재 사진 (얼굴·상체 중심) */
export const CURRENT_PHOTO_COVER_ALIGN: CoverVerticalAlign = 'upper-body';

/**
 * cover + yBias — 46bf32a drawImageCoverYBias
 * 가로를 채워 좌우 여백 없음, yBias로 얼굴 위치 조정
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
  let drawW: number;
  let drawH: number;
  let drawX: number;
  let drawY: number;

  if (imgAspect > boxAspect) {
    drawH = boxH;
    drawW = imgW * (boxH / imgH);
    drawX = boxX - (drawW - boxW) / 2;
    drawY = boxY + boxH * yBias * 0.5;
  } else {
    drawW = boxW * widthScale;
    drawH = imgH * (drawW / imgW);
    drawX = boxX + (boxW - drawW) / 2;
    drawY = boxY + (boxH - drawH) / 2 + boxH * yBias;
  }

  return { drawX, drawY, drawW, drawH };
};

/** cover — 현재 사진 (가로 채움, 세로 정렬) */
export const computeCoverFit = (
  imgW: number,
  imgH: number,
  boxX: number,
  boxY: number,
  boxW: number,
  boxH: number,
  verticalAlign: CoverVerticalAlign = 'upper-body',
): FrameFitRect => {
  const imgAspect = imgW / imgH;
  const boxAspect = boxW / boxH;
  let drawW: number;
  let drawH: number;
  let drawX: number;
  let drawY: number;

  if (imgAspect > boxAspect) {
    drawH = boxH;
    drawW = imgW * (boxH / imgH);
    drawX = boxX - (drawW - boxW) / 2;
    drawY = boxY;
  } else {
    drawW = boxW;
    drawH = imgH * (boxW / imgW);
    drawX = boxX;
    if (verticalAlign === 'upper-body') {
      drawY = boxY - (drawH - boxH) * 0.38;
    } else {
      drawY = verticalAlign === 'top' ? boxY : boxY - (drawH - boxH) / 2;
    }
  }

  return { drawX, drawY, drawW, drawH };
};
