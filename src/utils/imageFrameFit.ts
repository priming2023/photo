/**
 * 이미지 → 박스 맞춤 — Result 화면·영수증 캔버스 공통
 */

export interface FrameFitOptions {
  /** 1.0 = 전체 보임, 1.18 = feab2e3 검증값(살짝 줌인) */
  zoom?: number;
  /** 박스 높이 대비 아래로 이동 비율 */
  yBias?: number;
}

export type CoverVerticalAlign = 'center' | 'top' | 'upper-body';

export interface FrameFitRect {
  drawX: number;
  drawY: number;
  drawW: number;
  drawH: number;
}

/** 영수증·미리보기 — AI 미래 사진 (feab2e3: contain + 줌·아래 배치) */
export const FUTURE_PHOTO_FIT: FrameFitOptions = { zoom: 1.18, yBias: 0.07 };

/** cover(top) — 웹캠 현재 사진 (위·아래 살짝 잘림 허용) */
export const CURRENT_PHOTO_COVER_ALIGN: CoverVerticalAlign = 'top';

/**
 * contain + 줌 — feab2e3 drawImageFitZoom
 * zoom 후 가로가 박스를 넘으면 너비만 맞춤 → 좌우 잘림 방지, 세로는 yBias로 얼굴 위치 유지
 */
export const computeContainFit = (
  imgW: number,
  imgH: number,
  boxX: number,
  boxY: number,
  boxW: number,
  boxH: number,
  { zoom = 1, yBias = 0 }: FrameFitOptions = {},
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

  drawW *= zoom;
  drawH *= zoom;

  if (drawW > boxW) {
    const scale = boxW / drawW;
    drawW = boxW;
    drawH *= scale;
  }

  return {
    drawX: boxX + (boxW - drawW) / 2,
    drawY: boxY + (boxH - drawH) / 2 + boxH * yBias,
    drawW,
    drawH,
  };
};

/** cover — 현재 사진 (가로 채움, 세로 정렬) */
export const computeCoverFit = (
  imgW: number,
  imgH: number,
  boxX: number,
  boxY: number,
  boxW: number,
  boxH: number,
  verticalAlign: CoverVerticalAlign = 'top',
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
