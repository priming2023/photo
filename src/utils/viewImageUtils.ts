import { storeDisplayName } from '../config/store';
const loadImage = (src: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('이미지 로드 실패'));
    img.src = src;
  });

/** 현재의 나 + 미래의 나 나란히 합친 갤러리용 이미지 생성 */
export const createComparisonImage = async (
  originalUrl: string,
  transformedUrl: string,
  job: string,
  age: string,
): Promise<Blob> => {
  const [original, transformed] = await Promise.all([
    loadImage(originalUrl),
    loadImage(transformedUrl),
  ]);

  const W = 1080;
  const H = 720;
  const pad = 24;
  const gap = 16;
  const labelH = 48;
  const photoW = (W - pad * 2 - gap) / 2;
  const photoH = H - pad * 2 - labelH - 40;

  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(0, 0, W, H);

  ctx.fillStyle = '#94a3b8';
  ctx.font = 'bold 22px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(`${storeDisplayName()} · 미래의 내 모습`, W / 2, pad + 20);

  const drawPhoto = (
    img: HTMLImageElement,
    x: number,
    label: string,
    accent: string,
  ) => {
    const aspect = img.width / img.height;
    let dw = photoW;
    let dh = photoW / aspect;
    if (dh > photoH) {
      dh = photoH;
      dw = photoH * aspect;
    }
    const dx = x + (photoW - dw) / 2;
    const dy = pad + labelH + (photoH - dh) / 2;

    ctx.fillStyle = accent;
    ctx.font = 'bold 18px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(label, x + photoW / 2, pad + labelH - 12);

    ctx.save();
    ctx.beginPath();
    ctx.roundRect(x, pad + labelH, photoW, photoH, 16);
    ctx.clip();
    ctx.drawImage(img, dx, dy, dw, dh);
    ctx.restore();

    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(x, pad + labelH, photoW, photoH, 16);
    ctx.stroke();
  };

  drawPhoto(original, pad, '현재의 나', '#e2e8f0');
  drawPhoto(transformed, pad + photoW + gap, `미래의 나 · ${age} ${job}`, '#93c5fd');

  ctx.fillStyle = '#64748b';
  ctx.font = '14px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('14일간 보관 · QR로 다시 볼 수 있어요', W / 2, H - 16);

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error('이미지 생성 실패'))),
      'image/jpeg',
      0.88,
    );
  });
};

/**
 * 모바일: 공유 시트 → "사진에 저장"
 * PC: 파일 다운로드
 */
export const saveImageToGallery = async (
  blob: Blob,
  filename: string,
): Promise<'gallery' | 'download'> => {
  const file = new File([blob], filename, { type: 'image/jpeg' });

  if (navigator.canShare?.({ files: [file] })) {
    await navigator.share({ files: [file], title: '미래의 내 모습' });
    return 'gallery';
  }

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  return 'download';
};

/** 단일 URL → Blob */
export const fetchImageBlob = async (url: string): Promise<Blob> => {
  const res = await fetch(url);
  if (!res.ok) throw new Error('이미지 불러오기 실패');
  return res.blob();
};
