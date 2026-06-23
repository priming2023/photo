import React, { useEffect, useState } from 'react';
import { generateTransformedImage } from '../utils/falApi';

interface ProcessingProps {
  job: string;
  age: string;
  gender: string;
  originalImage: string;
  onFinish: (resultImage: string) => void;
}

const Processing: React.FC<ProcessingProps> = ({ job, age, gender, originalImage, onFinish }) => {
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState('사진을 분석하고 있어요...');

  useEffect(() => {
    let isComponentMounted = true;
    
    // 단순 시간 기반 애니메이션이 아닌, 실제 API 통신을 기다리며 프로그레스바를 올립니다.
    const runAI = async () => {
      // 텍스트 변환 타이머
      const timer1 = setTimeout(() => { if(isComponentMounted) setMessage(`멋진 ${age} ${job}의 모습으로...`); }, 1500);
      const timer2 = setTimeout(() => { if(isComponentMounted) setMessage('조금만 더 기다려주세요! ✨'); }, 3500);
      const timer3 = setTimeout(() => { if(isComponentMounted) setMessage('거의 다 완성되었어요!'); }, 6000);
      
      // 가짜 프로그레스 바 전진 (최대 95%까지만)
      const interval = setInterval(() => {
        setProgress(p => (p < 95 ? p + 1 : p));
      }, 80);

      try {
        // 실제 API 통신 (키가 없으면 유틸 내부에서 5초 딜레이 후 빈 문자열 반환)
        const resultUrl = await generateTransformedImage(originalImage, job, age, gender);
        
        if (isComponentMounted) {
          setProgress(100);
          clearInterval(interval);
          // 100% 채운 후 화면 넘김
          setTimeout(() => onFinish(resultUrl), 500);
        }
      } catch (error) {
        console.error("처리 중 에러 발생", error);
        // 에러가 나도 진행할 수 있도록 원본 빈값 전달
        if (isComponentMounted) {
          setProgress(100);
          setTimeout(() => onFinish(""), 500);
        }
      } finally {
        clearTimeout(timer1);
        clearTimeout(timer2);
        clearTimeout(timer3);
        clearInterval(interval);
      }
    };

    runAI();

    return () => {
      isComponentMounted = false;
    };
  }, [age, job, gender, originalImage, onFinish]);

  return (
    <div className="flex flex-col items-center justify-center w-full h-full p-8 animate-fade-in pt-16">
      <div className="bg-white p-20 rounded-[3rem] shadow-sm border border-gray-100 flex flex-col items-center max-w-4xl w-full">
        {/* 미니멀한 스피너 애니메이션 */}
        <div className="relative w-40 h-40 mb-12">
          <div className="absolute inset-0 border-8 border-gray-100 rounded-full"></div>
          <div 
            className="absolute inset-0 border-8 border-blue-400 rounded-full animate-spin border-t-transparent"
          ></div>
          <div className="absolute inset-0 flex items-center justify-center text-6xl">
            ⏳
          </div>
        </div>
        
        <h2 className="text-4xl font-black mb-12 text-gray-800 text-center leading-relaxed">
          {message}
        </h2>
        
        <div className="w-full max-w-2xl h-6 bg-gray-100 rounded-full overflow-hidden relative">
          <div 
            className="h-full bg-blue-400 transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
        <p className="mt-4 text-2xl text-gray-400 font-bold tracking-widest">
          {progress}%
        </p>
      </div>
    </div>
  );
};

export default Processing;
