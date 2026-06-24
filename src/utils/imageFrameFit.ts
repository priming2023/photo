/**
 * 이미지 → 박스 맞춤 (contain) — Result 화면·영수증 캔버스 공통
 * zoom 1.0 = 잘림 없이 전체 표시 (object-contain 과 동일)
 */

export interface FrameFitOptions {
  /** 1.0 = 전체 보임, 1.18 = feab2e3 검증값(살짝 줌인) */
  zoom?: number;
  /** 박스 높이 대비 아래로 이동 비율 */
  yBias?: number;
}

export interface FrameFitRect {
  drawX: number;
  drawY: number;
  drawW: number;
  drawH: number;
}

/** 영수증·미리보기 공통 — AI 미래 사진 (잘림 최소·일관 구도) */
export const FUTURE_PHOTO_FIT: FrameFitOptions = { zoom: 1.0, yBias: 0.05 };

/** 영수증 — 현재 사진 */
export const CURRENT_PHOTO_FIT: FrameFitOptions = { zoom: 1.0, yBias: 0 };

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

  return {
    drawX: boxX + (boxW - drawW) / 2,
    drawY: boxY + (boxH - drawH) / 2 + boxH * yBias,
    drawW,
    drawH,
  };
};
