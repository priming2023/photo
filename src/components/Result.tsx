import React, { useEffect, useState } from 'react';
import { renderReceiptPreview } from '../utils/receiptCanvas';
import { prepareReceiptQrUrl, type QrPrepareStatus } from '../utils/receiptQr';
import { printReceiptImage } from '../utils/receiptPrint';

interface ResultProps {
  originalImage: string;
  transformedImage?: string;
  job: string;
  age: string;
  gender: string;
  onRetake: () => void;
  onPrintComplete: () => void;
}

const Result: React.FC<ResultProps> = ({
  originalImage,
  transformedImage,
  job,
  age,
  gender,
  onRetake,
  onPrintComplete,
}) => {
  const [printPreviewUrl, setPrintPreviewUrl] = useState<string>('');
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [qrStatus, setQrStatus] = useState<'loading' | QrPrepareStatus>('loading');
  const [printing, setPrinting] = useState(false);

  const buildReceipt = async (url: string) =>
    renderReceiptPreview({
      originalImage,
      transformedImage,
      job,
      age,
      qrUrl: url,
    });

  useEffect(() => {
    let cancelled = false;

    const prepare = async () => {
      setQrStatus('loading');
      setQrUrl(null);
      setPrintPreviewUrl('');

      const result = await prepareReceiptQrUrl(
        originalImage,
        transformedImage,
        job,
        age,
        gender,
      );
      if (cancelled) return;

      setQrUrl(result.qrUrl);
      setQrStatus(result.status);

      const preview = await buildReceipt(result.qrUrl);
      if (!cancelled && preview) setPrintPreviewUrl(preview);
    };

    prepare();
    return () => { cancelled = true; };
  }, [originalImage, transformedImage, job, age, gender]);

  const handlePrint = async () => {
    if (!qrUrl || printing || qrStatus === 'loading') return;
    setPrinting(true);

    try {
      // 인쇄 직전 QR 포함 영수증 재생성 (미리보기 타이밍 이슈 방지)
      const freshReceipt = await buildReceipt(qrUrl);
      if (!freshReceipt) {
        alert('영수증을 준비하지 못했어요. 잠시 후 다시 시도해 주세요.');
        return;
      }

      const result = await printReceiptImage(freshReceipt);
      if (result.success) {
        setPrintPreviewUrl(freshReceipt);
        onPrintComplete();
      } else {
        alert(`인쇄에 실패했어요.\n${result.reason || '프린터 연결을 확인해 주세요.'}`);
      }
    } catch (e) {
      console.error('인쇄 오류:', e);
      alert('인쇄 중 오류가 발생했어요.');
    } finally {
      setPrinting(false);
    }
  };

  const qrReady = qrStatus !== 'loading' && !!qrUrl;

  return (
    <div className="flex flex-col lg:flex-row w-full min-h-screen lg:h-full p-4 sm:p-8 lg:p-12 items-stretch lg:items-center justify-start lg:justify-between gap-6 lg:gap-12 animate-fade-in pt-20 lg:pt-16 max-w-[1920px] mx-auto overflow-y-auto lg:overflow-hidden">
      <div className="flex flex-col items-center flex-1 bg-white p-6 sm:p-8 lg:p-12 rounded-3xl lg:rounded-[3rem] shadow-sm border border-gray-100 lg:h-full justify-center">
        <h2 className="text-xl sm:text-2xl lg:text-4xl font-black mb-6 lg:mb-10 text-gray-800 text-center">
          멋진 <span className="text-blue-500">{age} {job}</span>(으)로 변신했어요!
        </h2>

        <div className="flex flex-col sm:flex-row gap-4 lg:gap-8 mb-8 lg:mb-12 w-full justify-center items-center h-auto lg:h-[450px]">
          <div className="relative w-full max-w-[280px] sm:w-[240px] lg:w-[320px] aspect-[3/4] lg:aspect-auto lg:h-full bg-gray-50 border border-gray-200 rounded-2xl lg:rounded-3xl overflow-hidden shadow-sm">
            <div className="absolute top-3 left-3 lg:top-4 lg:left-4 bg-white/90 px-3 py-1 lg:px-4 rounded-full text-gray-700 font-bold z-10 text-xs lg:text-sm shadow-sm backdrop-blur-sm">현재의 나</div>
            <img src={originalImage} alt="원본" className="w-full h-full object-contain transform -scale-x-100 bg-gray-50" />
          </div>

          <div className="relative w-full max-w-[280px] sm:w-[240px] lg:w-[320px] aspect-[3/4] lg:aspect-auto lg:h-full bg-gray-50 border-4 border-blue-200 rounded-2xl lg:rounded-3xl overflow-hidden shadow-md">
            <div className="absolute top-3 left-3 lg:top-4 lg:left-4 bg-blue-500/90 px-3 py-1 lg:px-4 rounded-full text-white font-bold z-10 text-xs lg:text-sm shadow-sm backdrop-blur-sm">
              미래의 나
            </div>
            <img
              src={transformedImage || originalImage}
              alt="미래"
              className={`w-full h-full object-contain transform -scale-x-100 bg-gray-50 ${!transformedImage ? 'sepia-[.3] hue-rotate-[180deg] saturate-125' : ''}`}
            />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 lg:gap-6 w-full justify-center">
          <button
            onClick={onRetake}
            className="w-full sm:w-64 py-4 lg:py-6 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-2xl lg:rounded-[2rem] text-lg lg:text-2xl font-bold transition-all shadow-sm flex justify-center items-center gap-2"
          >
            🔄 다시 찍기
          </button>
          <button
            onClick={handlePrint}
            disabled={!qrReady || !printPreviewUrl || printing}
            className="w-full sm:w-80 py-4 lg:py-6 bg-gray-800 text-white hover:bg-black rounded-2xl lg:rounded-[2rem] text-lg lg:text-2xl font-black transition-all shadow-md hover:scale-105 flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {printing ? '인쇄 중...' : qrReady ? '🖨️ 영수증 인쇄하기' : 'QR 준비 중...'}
          </button>
        </div>
      </div>

      <div className="flex flex-col items-center justify-center bg-gray-50 p-6 lg:p-8 rounded-3xl lg:rounded-[3rem] lg:h-full shadow-inner border border-gray-200 relative shrink-0">
        <h3 className="text-base lg:text-xl font-bold text-gray-400 mb-4 lg:mb-6">인쇄 미리보기 (203 DPI)</h3>

        <div className="relative shadow-[10px_10px_30px_rgba(0,0,0,0.15)] border border-gray-300 bg-white w-[260px] h-[420px] sm:w-[300px] sm:h-[485px] lg:w-[341px] lg:h-[550px]">
          {printPreviewUrl ? (
            <img src={printPreviewUrl} alt="영수증 인쇄 미리보기" className="w-full h-full object-contain" />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 gap-2">
              <div className="w-8 h-8 border-4 border-gray-200 border-t-blue-400 rounded-full animate-spin" />
              <span className="text-sm">영수증·QR 준비 중...</span>
            </div>
          )}
        </div>
        {qrStatus === 'ok' && (
          <p className="text-xs text-green-500 mt-3">QR 코드 연결 완료</p>
        )}
        {qrStatus === 'loading' && (
          <p className="text-xs text-amber-500 mt-3">QR 코드 준비 중...</p>
        )}
        {qrStatus === 'fallback' && (
          <p className="text-xs text-amber-600 mt-3">QR 연결 (사진 직접 링크)</p>
        )}
        {qrStatus === 'home' && (
          <p className="text-xs text-amber-600 mt-3">QR 연결 (홈페이지 — 업로드 재시도 권장)</p>
        )}
      </div>
    </div>
  );
};

export default Result;
