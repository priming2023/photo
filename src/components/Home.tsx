import React from 'react';
import { storeDisplayName } from '../config/store';

interface HomeProps {
  onStart: () => void;
}

const Home: React.FC<HomeProps> = ({ onStart }) => {
  return (
    <div className="flex flex-col items-center justify-center w-full min-h-screen lg:h-full px-4 py-8 lg:p-0 animate-fade-in">
      <div className="bg-white p-8 sm:p-12 lg:p-16 rounded-3xl lg:rounded-[3rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.05)] border border-gray-100 flex flex-col items-center text-center w-full max-w-4xl relative">

        {/* 상단 장식 */}
        <div className="absolute -top-6 lg:-top-10 flex gap-2 lg:gap-4">
          <div className="w-12 h-14 lg:w-20 lg:h-24 bg-rose-200 rounded-b-full shadow-sm rotate-12"></div>
          <div className="w-12 h-14 lg:w-20 lg:h-24 bg-blue-200 rounded-b-full shadow-sm -rotate-6 mt-2 lg:mt-4"></div>
          <div className="w-12 h-14 lg:w-20 lg:h-24 bg-yellow-200 rounded-b-full shadow-sm rotate-6"></div>
        </div>

        <h2 className="text-sm sm:text-lg lg:text-2xl font-bold text-gray-400 tracking-widest mb-2 lg:mb-4 mt-6 lg:mt-8">
          {storeDisplayName()} 포토부스
        </h2>

        <h1 className="text-4xl sm:text-5xl lg:text-[5rem] font-black mb-8 lg:mb-16 text-gray-800 leading-tight tracking-tight">
          꿈을 이룬 내모습<br/>
          <span className="text-rose-400">사진관</span>
        </h1>

        <button
          onClick={onStart}
          className="relative group px-10 py-5 sm:px-16 sm:py-6 lg:px-20 lg:py-8 bg-gray-800 rounded-full text-xl sm:text-2xl lg:text-4xl font-black text-white hover:scale-105 transition-all duration-300 shadow-xl overflow-hidden w-full sm:w-auto"
        >
          <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-rose-400 to-orange-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
          <span className="relative flex items-center justify-center gap-3 lg:gap-4">
            사진 찍기 시작
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 lg:h-10 lg:w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </span>
        </button>
      </div>
    </div>
  );
};

export default Home;
