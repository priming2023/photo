/**
 * AI 변환용 이미지 전처리
 *
 * 문제: 세로형(3:4)으로 크롭할 경우 노트북 와이드(16:9) 웹캠에서 좌우가 너무 많이 잘림.
 *       또한 영수증 캔버스의 사진 영역은 가로형(455x300, 1.5:1)이므로, 세로 사진을 넣으면
 *       위아래가 심하게 잘려 줌인된 것처럼 보임.
 *
 * 해결: 노트북 와이드 비율을 살리면서 영수증 가로 박스에 딱 맞는 4:3 (landscape) 가로형 크롭 적용.
 */
export const cropToPortrait = (base64DataUrl: string): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();

    img.onload = () => {
      const srcW = img.naturalWidth;
      const srcH = img.naturalHeight;

      // ── 4:3 landscape 비율로 센터 크롭 (웹캠 좌우 잘림 방지) ─────────────
      const TARGET_RATIO = 4 / 3;
      const srcRatio     = srcW / srcH;

      let cropW: number, cropH: number, cropX: number, cropY: number;

      if (srcRatio > TARGET_RATIO) {
        // 원본이 더 넓은 가로형 (예: 16:9)
        cropH = srcH;
        cropW = Math.round(srcH * TARGET_RATIO);
        cropX = Math.round((srcW - cropW) / 2); // 수평 중앙
        cropY = 0;
      } else {
        // 원본이 더 세로로 긴 경우 (거의 발생 안함)
        cropW = srcW;
        cropH = Math.round(srcW / TARGET_RATIO);
        cropX = 0;
        cropY = Math.round((srcH - cropH) / 2); // 수직 중앙
      }

      // ── 출력 크기: 1024×768 (landscape_4_3 에 최적) ────────────────────
      const OUT_W = 1024;
      const OUT_H = 768;

      const canvas = document.createElement('canvas');
      canvas.width  = OUT_W;
      canvas.height = OUT_H;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(base64DataUrl);
        return;
      }

      ctx.drawImage(img, cropX, cropY, cropW, cropH, 0, 0, OUT_W, OUT_H);

      // JPEG 0.92 — AI 입력용 고품질 (원본 카메라 0.8보다 높게)
      resolve(canvas.toDataURL('image/jpeg', 0.92));
    };

    img.onerror = () => resolve(base64DataUrl);
    img.src = base64DataUrl;
  });
};
