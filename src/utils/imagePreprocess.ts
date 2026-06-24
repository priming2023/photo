/**
 * AI 변환용 이미지 전처리
 *
 * 문제: 웹캠이 1920×1080 가로(16:9)로 캡처
 *       → 얼굴이 작고 배경이 많이 포함됨
 *       → AI가 배경에 가중치 낭비, 얼굴 인식 정확도 저하
 *
 * 해결: 상반신 중심 3:4 세로 크롭 → 768×1024 리사이즈
 *       → 얼굴이 이미지의 40~60% 차지 → AI 집중도 극대화
 */
export const cropToPortrait = (base64DataUrl: string): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();

    img.onload = () => {
      const srcW = img.naturalWidth;
      const srcH = img.naturalHeight;

      // ── 3:4 portrait 비율로 센터 크롭 ─────────────────────────────────
      const TARGET_RATIO = 3 / 4;
      const srcRatio     = srcW / srcH;

      let cropW: number, cropH: number, cropX: number, cropY: number;

      if (srcRatio > TARGET_RATIO) {
        // 가로가 더 넓음 (일반 웹캠 16:9)
        // Method D: 상단 80% 사용 → 얼굴+가슴 포함, 클로즈업 완화
        const usableH = Math.round(srcH * 0.92);
        cropH = usableH;
        cropW = Math.round(usableH * TARGET_RATIO);
        cropX = Math.round((srcW - cropW) / 2); // 수평 중앙 정렬
        cropY = 0; // 상단(머리)부터 시작
      } else {
        // 이미 세로형 (portrait 또는 square)
        cropW = srcW;
        cropH = Math.round(srcW / TARGET_RATIO);
        cropX = 0;
        cropY = Math.round((srcH - cropH) / 2);
      }

      // ── 출력 크기: 768×1024 (portrait_4_3 에 최적) ────────────────────
      const OUT_W = 768;
      const OUT_H = 1024;

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
