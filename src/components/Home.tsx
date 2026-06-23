import React from 'react';

interface HomeProps {
  onStart: () => void;
}

const Home: React.FC<HomeProps> = ({ onStart }) => {
  return (
    <div className="flex flex-col items-center justify-center w-full h-full animate-fade-in">
      <div className="bg-white p-16 rounded-[3rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.05)] border border-gray-100 flex flex-col items-center text-center max-w-4xl relative">
        
        {/* 상단 장식 */}
        <div className="absolute -top-10 flex gap-4">
          <div className="w-20 h-24 bg-rose-200 rounded-b-full shadow-sm rotate-12"></div>
          <div className="w-20 h-24 bg-blue-200 rounded-b-full shadow-sm -rotate-6 mt-4"></div>
          <div className="w-20 h-24 bg-yellow-200 rounded-b-full shadow-sm rotate-6"></div>
        </div>

        <h2 className="text-2xl font-bold text-gray-400 tracking-widest mb-4 mt-8">
          월드킹 당진서산점 포토부스
        </h2>
        
        <h1 className="text-[5rem] font-black mb-16 text-gray-800 leading-tight tracking-tight">
          꿈을 이룬 내모습<br/>
          <span className="text-rose-400">사진관</span>
        </h1>
        
        <button 
          onClick={onStart}
          className="relative group px-20 py-8 bg-gray-800 rounded-full text-4xl font-black text-white hover:scale-105 transition-all duration-300 shadow-xl overflow-hidden"
        >
          <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-rose-400 to-orange-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
          <span className="relative flex items-center gap-4">
            사진 찍기 시작
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </span>
        </button>
      </div>
    </div>
  );
};

export default Home;
