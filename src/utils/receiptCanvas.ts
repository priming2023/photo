import QRCode from 'qrcode';
import { storeConfig, storeDisplayName } from '../config/store';

const PRINT_WIDTH = 495;
const PRINT_HEIGHT = 880;
const IMAGE_LOAD_TIMEOUT_MS = 8_000;

/** 외부 URL → blob URL 변환 (캔버스 CORS 문제 방지) */
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

const drawImageCover = (
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number,
  y: number,
  w: number,
  h: number,
  mirror: boolean,
  verticalAlign: 'center' | 'top' = 'top',
) => {
  const imgAspect = img.width / img.height;
  const boxAspect = w / h;
  let drawW: number;
  let drawH: number;
  let drawX: number;
  let drawY: number;

  if (imgAspect > boxAspect) {
    drawH = h;
    drawW = img.width * (h / img.height);
    drawX = x - (drawW - w) / 2;
    drawY = y;
  } else {
    drawW = w;
    drawH = img.height * (w / img.width);
    drawX = x;
    drawY = verticalAlign === 'top' ? y : y - (drawH - h) / 2;
  }

  ctx.save();
  ctx.filter = 'grayscale(100%) contrast(150%) brightness(120%)';
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();

  if (mirror) {
    ctx.translate(x + w / 2, y + h / 2);
    ctx.scale(-1, 1);
    ctx.drawImage(img, drawX - x - w / 2, drawY - y - h / 2, drawW, drawH);
  } else {
    ctx.drawImage(img, drawX, drawY, drawW, drawH);
  }

  ctx.restore();
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 4;
  ctx.strokeRect(x, y, w, h);
};

const drawQrPlaceholder = (ctx: CanvasRenderingContext2D) => {
  ctx.fillStyle = '#000000';
  ctx.fillRect(PRINT_WIDTH - 80, 20, 60, 60);
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(PRINT_WIDTH - 76, 24, 52, 52);
  ctx.fillStyle = '#000000';
  ctx.font = 'bold 10px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('QR CODE', PRINT_WIDTH - 50, 55);
};

const drawFooter = (ctx: CanvasRenderingContext2D, hasQr: boolean) => {
  const y = PRINT_HEIGHT - 110;

  ctx.beginPath();
  ctx.setLineDash([4, 4]);
  ctx.moveTo(20, y);
  ctx.lineTo(PRINT_WIDTH - 20, y);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.fillStyle = '#000000';
  ctx.textAlign = 'center';

  if (hasQr) {
    ctx.font = 'bold 15px sans-serif';
    ctx.fillText('QR 코드를 스캔하고 사진을 저장하세요!', PRINT_WIDTH / 2, y + 28);
    ctx.font = '13px sans-serif';
    ctx.fillText('iPhone: 공유 → 사진에 저장  |  Android: 갤러리 저장', PRINT_WIDTH / 2, y + 50);
  }

  ctx.font = 'bold 14px sans-serif';
  ctx.fillText(storeDisplayName(), PRINT_WIDTH / 2, y + 74);

  if (storeConfig.address) {
    ctx.font = '12px sans-serif';
    ctx.fillText(storeConfig.address, PRINT_WIDTH / 2, y + 92);
  }
  if (storeConfig.phone) {
    ctx.font = '12px sans-serif';
    ctx.fillText(storeConfig.phone, PRINT_WIDTH / 2, y + 108);
  }
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

  // 로고 이미지 (있으면) + 매장명
  let headerY = 50;
  try {
    const logo = await loadImage('/icon-192.png');
    ctx.drawImage(logo, 20, 12, 56, 56);
    headerY = 52;
  } catch {
    /* 로고 없으면 텍스트만 */
  }

  ctx.fillStyle = '#000000';
  ctx.font = 'bold 32px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(storeDisplayName(), 88, headerY);

  ctx.font = 'bold 14px sans-serif';
  const dateStr = new Date().toLocaleDateString('ko-KR');
  ctx.fillText(`${dateStr} | ${storeConfig.receiptTagline}`, 20, 82);

  if (qrUrl) {
    try {
      const qrDataUrl = await QRCode.toDataURL(qrUrl, { margin: 1, width: 80 });
      const qrImg = await loadImage(qrDataUrl);
      ctx.drawImage(qrImg, PRINT_WIDTH - 90, 10, 80, 80);
    } catch {
      drawQrPlaceholder(ctx);
    }
  } else {
    drawQrPlaceholder(ctx);
  }

  ctx.beginPath();
  ctx.setLineDash([5, 5]);
  ctx.moveTo(20, 100);
  ctx.lineTo(PRINT_WIDTH - 20, 100);
  ctx.stroke();
  ctx.setLineDash([]);

  const imgWidth = PRINT_WIDTH - 40;
  const imgHeight = 280;
  const futureSrc = transformedImage || originalImage;

  try {
    const originalImg = await loadImage(originalImage);
    drawImageCover(ctx, originalImg, 20, 115, imgWidth, imgHeight, true, 'top');
  } catch (e) {
    console.error('원본 이미지 렌더 실패:', e);
  }

  ctx.fillStyle = '#000000';
  ctx.fillRect(20, 115, 70, 28);
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 16px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('현재', 55, 135);

  const img2Y = 115 + imgHeight + 16;
  try {
    const futureImg = await loadImage(futureSrc);
    drawImageCover(ctx, futureImg, 20, img2Y, imgWidth, imgHeight, true, 'top');
  } catch (e) {
    console.error('변환 이미지 렌더 실패:', e);
    try {
      const fallback = await loadImage(originalImage);
      drawImageCover(ctx, fallback, 20, img2Y, imgWidth, imgHeight, true, 'top');
    } catch { /* skip */ }
  }

  ctx.fillStyle = '#000000';
  ctx.fillRect(20, img2Y, 80, 28);
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 16px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('미래의 나', 60, img2Y + 19);

  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(PRINT_WIDTH - 150, img2Y + imgHeight - 36, 130, 36);
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 3;
  ctx.strokeRect(PRINT_WIDTH - 150, img2Y + imgHeight - 36, 130, 36);
  ctx.fillStyle = '#000000';
  ctx.font = 'bold 16px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(`${age} ${job}`, PRINT_WIDTH - 85, img2Y + imgHeight - 12);

  drawFooter(ctx, !!qrUrl);

  try {
    return canvas.toDataURL('image/png');
  } catch (e) {
    console.error('캔버스 export 실패:', e);
    return '';
  }
};
