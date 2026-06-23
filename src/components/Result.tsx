import React, { useEffect, useState } from 'react';
import { renderReceiptPreview } from '../utils/receiptCanvas';
import { uploadImageToSupabase } from '../utils/supabase';
import { savePhotoSession, buildViewUrl } from '../utils/photoSession';

interface ResultProps {
  originalImage: string;
  transformedImage?: string; 
  job: string;
  age: string;
  onRetake: () => void;
  onPrint: () => void;
}

const Result: React.FC<ResultProps> = ({ originalImage, transformedImage, job, age, onRetake, onPrint }) => {
  const [printPreviewUrl, setPrintPreviewUrl] = useState<string>('');
  const [qrUrl, setQrUrl] = useState<string>('');

  // 1) 화면 진입 즉시 영수증 미리보기 (QR·업로드 기다리지 않음)
  useEffect(() => {
    let cancelled = false;

    const render = async () => {
      const preview = await renderReceiptPreview({
        originalImage,
        transformedImage,
        job,
        age,
        qrUrl: undefined,
      });
      if (!cancelled && preview) setPrintPreviewUrl(preview);
    };

    render();
    return () => { cancelled = true; };
  }, [originalImage, transformedImage, job, age]);

  // 2) Supabase 업로드 → 세션 저장 → QR URL 생성 → 영수증 재렌더 (백그라운드)
  useEffect(() => {
    let cancelled = false;

    const uploadAndRefreshQr = async () => {
      // 2-a) 변환 이미지를 Supabase Storage에 업로드
      const storageUrl = await uploadImageToSupabase(transformedImage || originalImage);
      if (cancelled) return;

      let viewUrl: string | undefined;

      if (storageUrl) {
        // 2-b) 세션 메타데이터(직업·나이) DB 저장 → 뷰 페이지 URL 획득
        const sessionId = await savePhotoSession(storageUrl, job, age);
        if (!cancelled && sessionId) {
          viewUrl = buildViewUrl(sessionId);
          setQrUrl(viewUrl);
        }
      }

      // 2-c) QR URL 반영한 영수증 재렌더
      const preview = await renderReceiptPreview({
        originalImage,
        transformedImage,
        job,
        age,
        qrUrl: viewUrl,
      });
      if (!cancelled && preview) setPrintPreviewUrl(preview);
    };

    uploadAndRefreshQr();
    return () => { cancelled = true; };
  }, [originalImage, transformedImage, job, age]);

  return (
    <div className="flex w-full h-full p-12 items-center justify-between gap-12 animate-fade-in pt-16 max-w-[1920px] mx-auto">
      <div className="flex flex-col items-center flex-1 bg-white p-12 rounded-[3rem] shadow-sm border border-gray-100 h-full justify-center">
        <h2 className="text-4xl font-black mb-10 text-gray-800">
          멋진 <span className="text-blue-500">{age} {job}</span>(으)로 변신했어요!
        </h2>
        
        <div className="flex gap-8 mb-12 h-[450px]">
          <div className="relative w-[320px] bg-gray-50 border border-gray-200 rounded-3xl overflow-hidden shadow-sm">
            <div className="absolute top-4 left-4 bg-white/90 px-4 py-1 rounded-full text-gray-700 font-bold z-10 text-sm shadow-sm backdrop-blur-sm">현재의 나</div>
            <img src={originalImage} alt="원본" className="w-full h-full object-cover transform -scale-x-100" />
          </div>

          <div className="relative w-[320px] bg-gray-50 border-4 border-blue-200 rounded-3xl overflow-hidden shadow-md">
            <div className="absolute top-4 left-4 bg-blue-500/90 px-4 py-1 rounded-full text-white font-bold z-10 text-sm shadow-sm backdrop-blur-sm">
              미래의 나
            </div>
            <img 
              src={transformedImage || originalImage} 
              alt="미래" 
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
            disabled={!printPreviewUrl}
            className="w-80 py-6 bg-gray-800 text-white hover:bg-black rounded-[2rem] text-2xl font-black transition-all shadow-md hover:scale-105 flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            🖨️ 영수증 인쇄하기
          </button>
        </div>
      </div>

      <div className="flex flex-col items-center justify-center bg-gray-50 p-8 rounded-[3rem] h-full shadow-inner border border-gray-200 relative">
        <h3 className="text-xl font-bold text-gray-400 mb-6">인쇄 미리보기 (203 DPI)</h3>
        
        <div className="relative shadow-[10px_10px_30px_rgba(0,0,0,0.15)] border border-gray-300 bg-white" style={{ width: '341px', height: '550px' }}>
          {printPreviewUrl ? (
             <img src={printPreviewUrl} alt="영수증 인쇄 미리보기" className="w-full h-full object-contain" />
          ) : (
             <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 gap-2">
               <div className="w-8 h-8 border-4 border-gray-200 border-t-blue-400 rounded-full animate-spin" />
               <span className="text-sm">영수증 준비 중...</span>
             </div>
          )}
        </div>
        {qrUrl && (
          <p className="text-xs text-green-500 mt-3">QR 코드 연결 완료</p>
        )}
      </div>
    </div>
  );
};

export default Result;
