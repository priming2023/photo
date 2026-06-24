import QRCode from 'qrcode';
import { storeDisplayName } from '../config/store';
import {
  computeContainFit,
  computeCoverFit,
  CURRENT_PHOTO_COVER_ALIGN,
  FUTURE_PHOTO_FIT,
} from './imageFrameFit';
import { getReceiptQrFallbackUrl } from './receiptQr';

/** 203 DPI — 62×100mm 영수증 (오늘 작업 전 검증된 레이아웃) */
const PRINT_WIDTH = 495;
const PRINT_HEIGHT = 799;
const IMAGE_LOAD_TIMEOUT_MS = 8_000;

const toCanvasSafeSrc = async (src: string): Promise<string> => {
  if (src.startsWith('data:') || src.startsWith('blob:')) return src;
  const res = await fetch(src);
  if (!res.ok) throw new Error(`fetch failed: ${res.status}`);
  const blob = await res.blob();
  return URL.createObjectURL(blob);
};

const loadImage = async (src: string): Promise<HTMLImageElement> => {
  let objectUrl: string | null = null;
  let safeSrc = src;

  try {
    if (!src.startsWith('data:')) {
      safeSrc = await toCanvasSafeSrc(src);
      if (safeSrc.startsWith('blob:')) objectUrl = safeSrc;
    }
  } catch {
    safeSrc = src;
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    const timer = setTimeout(() => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
      reject(new Error('image timeout'));
    }, IMAGE_LOAD_TIMEOUT_MS);

    if (!safeSrc.startsWith('data:') && !safeSrc.startsWith('blob:')) {
      img.crossOrigin = 'anonymous';
    }

    img.onload = () => {
      clearTimeout(timer);
      resolve(img);
    };
    img.onerror = () => {
      clearTimeout(timer);
      if (objectUrl) URL.revokeObjectURL(objectUrl);
      reject(new Error('image load failed'));
    };
    img.src = safeSrc;
  });
};

const drawClippedImage = (
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  boxX: number,
  boxY: number,
  boxW: number,
  boxH: number,
  mirror: boolean,
  rect: { drawX: number; drawY: number; drawW: number; drawH: number },
  grayscale = true,
) => {
  ctx.save();
  if (grayscale) {
    ctx.filter = 'grayscale(100%) contrast(150%) brightness(120%)';
  }
  ctx.beginPath();
  ctx.rect(boxX, boxY, boxW, boxH);
  ctx.clip();

  if (mirror) {
    ctx.translate(boxX + boxW / 2, boxY + boxH / 2);
    ctx.scale(-1, 1);
    ctx.drawImage(
      img,
      rect.drawX - boxX - boxW / 2,
      rect.drawY - boxY - boxH / 2,
      rect.drawW,
      rect.drawH,
    );
  } else {
    ctx.drawImage(img, rect.drawX, rect.drawY, rect.drawW, rect.drawH);
  }

  ctx.restore();
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 4;
  ctx.strokeRect(boxX, boxY, boxW, boxH);
};

/** 현재 사진 — cover(top), 위·아래 살짝 잘림 */
const drawCurrentPhoto = (
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number,
  y: number,
  w: number,
  h: number,
  mirror: boolean,
) => {
  const rect = computeCoverFit(
    img.width,
    img.height,
    x,
    y,
    w,
    h,
    CURRENT_PHOTO_COVER_ALIGN,
  );
  drawClippedImage(ctx, img, x, y, w, h, mirror, rect);
};

/** 미래 사진 — feab2e3 contain + 줌(1.18) + yBias, 좌우 잘림 방지 */
const drawFuturePhoto = (
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number,
  y: number,
  w: number,
  h: number,
  mirror: boolean,
) => {
  const rect = computeContainFit(
    img.width,
    img.height,
    x,
    y,
    w,
    h,
    FUTURE_PHOTO_FIT,
  );
  drawClippedImage(ctx, img, x, y, w, h, mirror, rect);
};

const drawQrCode = async (
  ctx: CanvasRenderingContext2D,
  qrUrl: string,
): Promise<boolean> => {
  const urls = [qrUrl, getReceiptQrFallbackUrl()];

  for (const url of urls) {
    try {
      const qrDataUrl = await QRCode.toDataURL(url, {
        margin: 1,
        width: 200,
        errorCorrectionLevel: 'M',
      });
      const qrImg = await loadImage(qrDataUrl);
      ctx.drawImage(qrImg, PRINT_WIDTH - 90, 10, 80, 80);
      return true;
    } catch (e) {
      console.warn('[Receipt] QR 생성 실패, 재시도:', url.slice(0, 40), e);
    }
  }

  return false;
};

export interface ReceiptRenderInput {
  originalImage: string;
  transformedImage?: string;
  job: string;
  age: string;
  qrUrl?: string;
}

/** 203 DPI 영수증 캔버스 렌더링 */
export const renderReceiptPreview = async ({
  originalImage,
  transformedImage,
  job,
  age,
  qrUrl,
}: ReceiptRenderInput): Promise<string> => {
  const canvas = document.createElement('canvas');
  canvas.width = PRINT_WIDTH;
  canvas.height = PRINT_HEIGHT;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, PRINT_WIDTH, PRINT_HEIGHT);

  ctx.fillStyle = '#000000';
  ctx.font = 'bold 36px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(storeDisplayName(), 20, 50);

  ctx.font = 'bold 16px sans-serif';
  const dateStr = new Date().toLocaleDateString('ko-KR');
  ctx.fillText(`${dateStr} | 미래의 내 모습 포토부스`, 20, 80);

  const effectiveQrUrl = qrUrl || getReceiptQrFallbackUrl();
  const qrDrawn = await drawQrCode(ctx, effectiveQrUrl);
  if (!qrDrawn) {
    console.error('[Receipt] QR 코드를 그리지 못함 — 인쇄 전 재시도 필요');
  }

  ctx.beginPath();
  ctx.setLineDash([5, 5]);
  ctx.moveTo(20, 100);
  ctx.lineTo(PRINT_WIDTH - 20, 100);
  ctx.stroke();
  ctx.setLineDash([]);

  const imgWidth = PRINT_WIDTH - 40;
  const imgHeight = 300;
  const futureSrc = transformedImage || originalImage;

  try {
    const originalImg = await loadImage(originalImage);
    drawCurrentPhoto(ctx, originalImg, 20, 120, imgWidth, imgHeight, true);
  } catch (e) {
    console.error('원본 이미지 렌더 실패:', e);
  }

  ctx.fillStyle = '#000000';
  ctx.fillRect(20, 120, 70, 30);
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 18px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('현재', 55, 142);

  const img2Y = 120 + imgHeight + 20;
  try {
    const futureImg = await loadImage(futureSrc);
    drawFuturePhoto(ctx, futureImg, 20, img2Y, imgWidth, imgHeight, true);
  } catch (e) {
    console.error('변환 이미지 렌더 실패, 원본으로 대체:', e);
    try {
      const fallback = await loadImage(originalImage);
      drawFuturePhoto(ctx, fallback, 20, img2Y, imgWidth, imgHeight, true);
    } catch { /* skip */ }
  }

  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(PRINT_WIDTH - 150, img2Y + imgHeight - 40, 130, 40);
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 3;
  ctx.strokeRect(PRINT_WIDTH - 150, img2Y + imgHeight - 40, 130, 40);
  ctx.fillStyle = '#000000';
  ctx.font = 'bold 18px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(`${age} ${job}`, PRINT_WIDTH - 85, img2Y + imgHeight - 14);

  try {
    return canvas.toDataURL('image/png');
  } catch (e) {
    console.error('캔버스 export 실패:', e);
    return '';
  }
};

export const RECEIPT_PRINT_WIDTH_MM = 80;
export const RECEIPT_ASPECT_RATIO = PRINT_WIDTH / PRINT_HEIGHT;
