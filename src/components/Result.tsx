import React, { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { uploadImageToSupabase } from '../utils/supabase';

interface ResultProps {
  originalImage: string;
  transformedImage?: string; 
  job: string;
  age: string;
  onRetake: () => void;
  onPrint: () => void;
}

const Result: React.FC<ResultProps> = ({ originalImage, transformedImage, job, age, onRetake, onPrint }) => {
  const printCanvasRef = useRef<HTMLCanvasElement>(null);
  const [printPreviewUrl, setPrintPreviewUrl] = useState<string>('');
  const [qrUrl, setQrUrl] = useState<string>('');

  // 203 DPI 매핑: 62x100mm = 495x799 픽셀
  const PRINT_WIDTH = 495;
  const PRINT_HEIGHT = 799;

  useEffect(() => {
    // 사진 생성 완료 시 곧바로 Supabase에 업로드하여 QR URL 생성
    const uploadPhoto = async () => {
      const url = await uploadImageToSupabase(transformedImage || originalImage);
      if (url) {
        setQrUrl(url);
      }
    };
    uploadPhoto();
  }, [originalImage, transformedImage]);

  useEffect(() => {
    // Hidden Canvas를 이용하여 203 DPI (495x799) 해상도로 정확히 인쇄 이미지를 렌더링
    const generatePrintData = async () => {
      const canvas = printCanvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // 1. 하얀 배경
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, PRINT_WIDTH, PRINT_HEIGHT);

      // 2. 타이틀 '월드킹 당진서산점'
      ctx.fillStyle = '#000000';
      ctx.font = 'bold 36px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('월드킹 당진서산점', 20, 50);

      // 3. 날짜 및 서브 타이틀
      ctx.font = 'bold 16px sans-serif';
      const dateStr = new Date().toLocaleDateString('ko-KR');
      ctx.fillText(`${dateStr} | 미래의 내 모습 포토부스`, 20, 80);

      // 4. 가상의 QR 코드 박스 (우측 상단) 또는 실제 QR
      if (qrUrl) {
        try {
          const qrDataUrl = await QRCode.toDataURL(qrUrl, { margin: 1, width: 80 });
          const qrImg = new Image();
          await new Promise<void>((resolve) => {
            qrImg.onload = () => {
              ctx.drawImage(qrImg, PRINT_WIDTH - 90, 10, 80, 80);
              resolve();
            };
            qrImg.src = qrDataUrl;
          });
        } catch (e) {
          console.error("QR 렌더링 에러:", e);
        }
      } else {
        ctx.fillRect(PRINT_WIDTH - 80, 20, 60, 60);
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(PRINT_WIDTH - 76, 24, 52, 52);
        ctx.fillStyle = '#000000';
        ctx.font = 'bold 10px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('QR CODE', PRINT_WIDTH - 50, 55);
      }

      // 점선 구분선
      ctx.beginPath();
      ctx.setLineDash([5, 5]);
      ctx.moveTo(20, 100);
      ctx.lineTo(PRINT_WIDTH - 20, 100);
      ctx.stroke();
      ctx.setLineDash([]); // 점선 해제

      // 이미지 렌더링 유틸리티 (비율에 맞게 채우기: object-fit cover)
      const drawImageCover = async (src: string, x: number, y: number, w: number, h: number, isMirror: boolean) => {
        return new Promise<void>((resolve) => {
          const img = new Image();
          img.onload = () => {
            const imgAspect = img.width / img.height;
            const boxAspect = w / h;
            let drawW, drawH, drawX, drawY;

            if (imgAspect > boxAspect) {
              drawH = h;
              drawW = img.width * (h / img.height);
              drawX = x - (drawW - w) / 2;
              drawY = y;
            } else {
              drawW = w;
              drawH = img.height * (w / img.width);
              drawX = x;
              drawY = y - (drawH - h) / 2;
            }

            // 흑백(Dithering 효과 시뮬레이션용)을 위해 필터 적용
            ctx.save();
            ctx.filter = 'grayscale(100%) contrast(150%) brightness(120%)';
            
            // 패스 클리핑으로 둥근 네모 밖으로 안 삐져나가게
            ctx.beginPath();
            ctx.rect(x, y, w, h);
            ctx.clip();

            if (isMirror) {
              // 화면에서 거울 모드로 봤던 경우를 고려 (필요시)
              ctx.translate(x + w / 2, y + h / 2);
              ctx.scale(-1, 1);
              ctx.drawImage(img, drawX - x - w / 2, drawY - y - h / 2, drawW, drawH);
            } else {
              ctx.drawImage(img, drawX, drawY, drawW, drawH);
            }
            
            ctx.restore();

            // 테두리
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 4;
            ctx.strokeRect(x, y, w, h);
            resolve();
          };
          img.src = src;
        });
      };

      // 5. 첫 번째 이미지 (현재)
      const imgWidth = PRINT_WIDTH - 40;
      const imgHeight = 300;
      await drawImageCover(originalImage, 20, 120, imgWidth, imgHeight, true);
      
      // 현재 라벨
      ctx.fillStyle = '#000000';
      ctx.fillRect(20, 120, 70, 30);
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 18px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('현재', 55, 142);

      // 6. 두 번째 이미지 (미래)
      const img2Y = 120 + imgHeight + 20;
      await drawImageCover(transformedImage || originalImage, 20, img2Y, imgWidth, imgHeight, true);

      // 미래 라벨
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(PRINT_WIDTH - 150, img2Y + imgHeight - 40, 130, 40);
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 3;
      ctx.strokeRect(PRINT_WIDTH - 150, img2Y + imgHeight - 40, 130, 40);
      ctx.fillStyle = '#000000';
      ctx.font = 'bold 18px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`${age} ${job}`, PRINT_WIDTH - 85, img2Y + imgHeight - 14);

      // 결과 추출
      setPrintPreviewUrl(canvas.toDataURL('image/png'));
    };

    generatePrintData();
  }, [originalImage, transformedImage, age, job, qrUrl]);


  return (
    <div className="flex w-full h-full p-12 items-center justify-between gap-12 animate-fade-in pt-16 max-w-[1920px] mx-auto">
      
      {/* 203 DPI 실제 인쇄 픽셀 맵핑용 숨겨진 캔버스 (495x799) */}
      <canvas ref={printCanvasRef} width={PRINT_WIDTH} height={PRINT_HEIGHT} className="hidden" />

      {/* 왼쪽: 화면 프리뷰 및 조작 영역 */}
      <div className="flex flex-col items-center flex-1 bg-white p-12 rounded-[3rem] shadow-sm border border-gray-100 h-full justify-center">
        <h2 className="text-4xl font-black mb-10 text-gray-800">
          멋진 <span className="text-blue-500">{age} {job}</span>(으)로 변신했어요!
        </h2>
        
        <div className="flex gap-8 mb-12 h-[450px]">
          {/* 원본 */}
          <div className="relative w-[320px] bg-gray-50 border border-gray-200 rounded-3xl overflow-hidden shadow-sm">
            <div className="absolute top-4 left-4 bg-white/90 px-4 py-1 rounded-full text-gray-700 font-bold z-10 text-sm shadow-sm backdrop-blur-sm">현재의 나</div>
            <img src={originalImage} alt="원본" className="w-full h-full object-cover transform -scale-x-100" />
          </div>

          {/* 미래 모습 */}
          <div className="relative w-[320px] bg-gray-50 border-4 border-blue-200 rounded-3xl overflow-hidden shadow-md">
            <div className="absolute top-4 left-4 bg-blue-500/90 px-4 py-1 rounded-full text-white font-bold z-10 text-sm shadow-sm backdrop-blur-sm">
              미래의 나
            </div>
            <img 
              src={transformedImage || originalImage} 
              alt="미래" 
              // API 연결 전이면 임시 필터를 보여줌
              className={`w-full h-full object-cover transform -scale-x-100 ${!transformedImage ? 'sepia-[.3] hue-rotate-[180deg] saturate-125' : ''}`} 
            />
          </div>
        </div>

        <div className="flex gap-6 w-full justify-center">
          <button 
            onClick={onRetake}
            className="w-64 py-6 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-[2rem] text-2xl font-bold transition-all shadow-sm flex justify-center items-center gap-2"
          >
            🔄 다시 찍기
          </button>
          <button 
            onClick={onPrint}
            className="w-80 py-6 bg-gray-800 text-white hover:bg-black rounded-[2rem] text-2xl font-black transition-all shadow-md hover:scale-105 flex justify-center items-center gap-2"
          >
            🖨️ 영수증 인쇄하기
          </button>
        </div>
      </div>

      {/* 오른쪽: 495x799 Canvas를 이용해 뽑아낸 실제 영수증 픽셀 프리뷰 이미지 */}
      <div className="flex flex-col items-center justify-center bg-gray-50 p-8 rounded-[3rem] h-full shadow-inner border border-gray-200 relative">
        <h3 className="text-xl font-bold text-gray-400 mb-6">인쇄 미리보기 (203 DPI)</h3>
        
        {/* CSS로 화면 크기에 맞게 축소하여 보여줌 */}
        <div className="relative shadow-[10px_10px_30px_rgba(0,0,0,0.15)] border border-gray-300 bg-white" style={{ width: '341px', height: '550px' }}>
          {printPreviewUrl ? (
             <img src={printPreviewUrl} alt="영수증 인쇄 미리보기" className="w-full h-full object-contain" />
          ) : (
             <div className="w-full h-full flex items-center justify-center text-gray-400">영수증 렌더링 중...</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Result;
