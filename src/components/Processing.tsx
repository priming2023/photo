import React, { useEffect, useState, useCallback } from 'react';
import { generateTransformedImage } from '../utils/falApi';

interface ProcessingProps {
  job: string;
  age: string;
  gender: string;
  originalImage: string;
  onFinish: (resultImage: string) => void;
  onRetry?: () => void;
}

const Processing: React.FC<ProcessingProps> = ({
  job,
  age,
  gender,
  originalImage,
  onFinish,
  onRetry,
}) => {
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState('사진을 분석하고 있어요...');
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);

  const runAI = useCallback(async (mounted: { current: boolean }) => {
    setFailed(false);
    setProgress(0);
    setMessage('사진을 분석하고 있어요...');

    const timer1 = setTimeout(() => { if (mounted.current) setMessage(`멋진 ${age} ${job}의 모습으로 변신 중...`); }, 2000);
    const timer2 = setTimeout(() => { if (mounted.current) setMessage('옷과 배경을 입히고 있어요 👔'); }, 5000);
    const timer3 = setTimeout(() => { if (mounted.current) setMessage('얼굴은 그대로, 나이만 바꾸는 중이에요 ✨'); }, 10000);
    const timer4 = setTimeout(() => { if (mounted.current) setMessage('거의 다 완성되었어요!'); }, 18000);

    const interval = setInterval(() => {
      setProgress((p) => (p < 95 ? p + 1 : p));
    }, 120);

    try {
      const resultUrl = await generateTransformedImage(originalImage, job, age, gender);

      if (mounted.current) {
        setProgress(100);
        clearInterval(interval);
        setMessage(resultUrl ? '완성! 🎉' : '기본 필터로 보여드릴게요');
        setTimeout(() => onFinish(resultUrl), 500);
      }
    } catch (error) {
      console.error('처리 중 에러 발생', error);
      if (mounted.current) {
        setProgress(100);
        clearInterval(interval);
        const errMsg = error instanceof Error ? error.message : '';
        if (errMsg.includes('크레딧')) {
          setMessage('AI 크레딧이 부족해요 💳 관리자에게 문의해 주세요');
        } else if (errMsg.includes('시간 초과')) {
          setMessage('시간이 너무 오래 걸려요 ⏱️');
        } else {
          setMessage('AI 연결이 어려워요 🙏');
        }
        setFailed(true);
      }
    } finally {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
      clearInterval(interval);
    }
  }, [age, job, gender, originalImage, onFinish]);

  useEffect(() => {
    const mounted = { current: true };
    runAI(mounted);
    return () => { mounted.current = false; };
  }, [runAI, attempt]);

  return (
    <div className="flex flex-col items-center justify-center w-full min-h-screen lg:h-full px-4 py-20 lg:p-8 lg:pt-16 animate-fade-in">
      <div className="bg-white p-8 sm:p-12 lg:p-20 rounded-3xl lg:rounded-[3rem] shadow-sm border border-gray-100 flex flex-col items-center max-w-4xl w-full">
        <div className="relative w-24 h-24 lg:w-40 lg:h-40 mb-8 lg:mb-12">
          <div className="absolute inset-0 border-4 lg:border-8 border-gray-100 rounded-full"></div>
          {!failed && (
            <div className="absolute inset-0 border-4 lg:border-8 border-blue-400 rounded-full animate-spin border-t-transparent"></div>
          )}
          <div className="absolute inset-0 flex items-center justify-center text-4xl lg:text-6xl">
            {failed ? '😔' : '⏳'}
          </div>
        </div>

        <h2 className="text-xl sm:text-2xl lg:text-4xl font-black mb-8 lg:mb-12 text-gray-800 text-center leading-relaxed px-2">
          {message}
        </h2>

        <div className="w-full max-w-2xl h-4 lg:h-6 bg-gray-100 rounded-full overflow-hidden relative">
          <div
            className="h-full bg-blue-400 transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
        <p className="mt-3 lg:mt-4 text-lg lg:text-2xl text-gray-400 font-bold tracking-widest">
          {progress}%
        </p>

        {failed && (
          <div className="flex flex-col sm:flex-row gap-3 mt-8 w-full max-w-md">
            <button
              onClick={() => setAttempt((a) => a + 1)}
              className="flex-1 py-4 bg-gray-800 text-white rounded-2xl text-lg font-bold hover:bg-black transition-all"
            >
              🔄 다시 시도
            </button>
            {onRetry && (
              <button
                onClick={onRetry}
                className="flex-1 py-4 bg-gray-100 text-gray-600 rounded-2xl text-lg font-bold hover:bg-gray-200 transition-all"
              >
                📷 다시 찍기
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Processing;
