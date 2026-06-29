import React, { useState } from 'react';

interface SelectionProps {
  onComplete: (job: string, age: string, gender: string) => void;
}

const JOBS = [
  { id: 'athlete', name: '운동선수', icon: '⚽️' },
  { id: 'doctor', name: '의사', icon: '🩺' },
  { id: 'youtuber', name: '유튜버', icon: '▶️' },
  { id: 'teacher', name: '선생님', icon: '📚' },
  { id: 'chef', name: '요리사', icon: '🍳' },
  { id: 'police', name: '경찰관', icon: '🚓' },
  { id: 'pro_gamer', name: '프로게이머', icon: '🎮' },
  { id: 'singer', name: '가수', icon: '🎤' },
  { id: 'scientist', name: '과학자', icon: '🔬' },
  { id: 'firefighter', name: '소방관', icon: '🚒' },
  { id: 'nurse', name: '간호사', icon: '💉' },
  { id: 'judge', name: '판사', icon: '⚖️' },
  { id: 'lawyer', name: '변호사', icon: '💼' },
  { id: 'vet', name: '수의사', icon: '🐶' },
  { id: 'pilot', name: '파일럿', icon: '✈️' },
  { id: 'flight_attendant', name: '스튜어디스', icon: '🛫' },
  { id: 'designer', name: '디자이너', icon: '🎨' },
  { id: 'writer', name: '작가', icon: '✍️' },
];

const AGES = ['30살', '40살', '50살', '60살'];
const GENDERS = ['남자', '여자'];

const Selection: React.FC<SelectionProps> = ({ onComplete }) => {
  const [selectedJob, setSelectedJob] = useState('');
  const [selectedAge, setSelectedAge] = useState('');
  const [selectedGender, setSelectedGender] = useState('');
  return (
    <div className="flex flex-col w-full min-h-screen lg:h-full px-4 sm:px-8 lg:px-20 py-20 lg:py-16 max-w-[1920px] mx-auto animate-slide-up relative overflow-y-auto lg:overflow-hidden">
      <h2 className="text-2xl sm:text-3xl lg:text-5xl font-black text-center mb-4 lg:mb-8 text-gray-800 tracking-tight">
        어떤 모습으로 <span className="text-rose-500">변신</span>할까요?
      </h2>

      <div className="flex flex-col lg:h-full gap-4 lg:gap-6 pb-6 lg:pb-0">
        {/* 직업 선택 */}
        <div className="bg-white p-4 sm:p-6 lg:p-8 rounded-2xl lg:rounded-[2.5rem] shadow-sm border border-gray-100 lg:flex-1 flex flex-col">
          <h3 className="text-lg lg:text-2xl font-bold mb-3 lg:mb-4 text-gray-500 flex items-center gap-2 lg:gap-3">
            <span className="w-7 h-7 lg:w-8 lg:h-8 rounded-full bg-rose-100 text-rose-500 flex items-center justify-center text-xs lg:text-sm shrink-0">1</span>
            나의 꿈 (직업)
          </h3>
          <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-2 lg:gap-3 lg:flex-1">
            {JOBS.map((job) => (
              <button
                key={job.id}
                onClick={() => setSelectedJob(job.name)}
                className={`flex flex-col items-center justify-center p-2 rounded-xl lg:rounded-2xl border-2 transition-all duration-200 min-h-[88px] lg:min-h-0 ${
                  selectedJob === job.name
                    ? 'bg-rose-50 border-rose-400 text-rose-600 scale-105 shadow-md'
                    : 'bg-gray-50 border-transparent text-gray-600 hover:bg-gray-100'
                }`}
              >
                <span className="text-3xl lg:text-5xl mb-1 lg:mb-2 drop-shadow-sm">{job.icon}</span>
                <span className="text-xs sm:text-sm lg:text-lg font-bold leading-tight text-center">{job.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 성별 및 나이 선택 영역 */}
        <div className="flex flex-col lg:flex-row gap-4 lg:gap-6 lg:h-48">
          {/* 성별 선택 */}
          <div className="bg-white p-4 sm:p-6 rounded-2xl lg:rounded-[2.5rem] shadow-sm border border-gray-100 lg:flex-[0.5] flex flex-col">
            <h3 className="text-base lg:text-xl font-bold mb-3 lg:mb-4 text-gray-500 flex items-center gap-2 lg:gap-3">
              <span className="w-7 h-7 lg:w-8 lg:h-8 rounded-full bg-green-100 text-green-500 flex items-center justify-center text-xs lg:text-sm shrink-0">2</span>
              성별
            </h3>
            <div className="grid grid-cols-2 gap-2 lg:gap-3 lg:flex-1">
              {GENDERS.map((gender) => (
                <button
                  key={gender}
                  onClick={() => setSelectedGender(gender)}
                  className={`rounded-xl lg:rounded-2xl border-2 text-lg lg:text-2xl font-bold transition-all duration-200 py-4 lg:py-0 ${
                    selectedGender === gender
                      ? 'bg-green-50 border-green-400 text-green-600 scale-105 shadow-md'
                      : 'bg-gray-50 border-transparent text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {gender}
                </button>
              ))}
            </div>
          </div>

          {/* 나이 선택 */}
          <div className="bg-white p-4 sm:p-6 rounded-2xl lg:rounded-[2.5rem] shadow-sm border border-gray-100 lg:flex-1 flex flex-col">
            <h3 className="text-base lg:text-xl font-bold mb-3 lg:mb-4 text-gray-500 flex items-center gap-2 lg:gap-3">
              <span className="w-7 h-7 lg:w-8 lg:h-8 rounded-full bg-blue-100 text-blue-500 flex items-center justify-center text-xs lg:text-sm shrink-0">3</span>
              몇 살 때 모습일까요?
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 lg:gap-3 lg:flex-1">
              {AGES.map((age) => (
                <button
                  key={age}
                  onClick={() => setSelectedAge(age)}
                  className={`rounded-xl lg:rounded-2xl border-2 text-base sm:text-lg lg:text-2xl font-bold transition-all duration-200 py-3 lg:py-0 ${
                    selectedAge === age
                      ? 'bg-blue-50 border-blue-400 text-blue-600 scale-105 shadow-md'
                      : 'bg-gray-50 border-transparent text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {age}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={() => {
              if (selectedJob && selectedAge && selectedGender) {
                onComplete(selectedJob, selectedAge, selectedGender);
              }
            }}
            disabled={!selectedJob || !selectedAge || !selectedGender}
            className={`w-full lg:w-64 h-14 lg:h-auto rounded-2xl lg:rounded-[2.5rem] text-xl lg:text-3xl font-black transition-all duration-300 flex items-center justify-center gap-3 lg:gap-4 shrink-0 ${
              selectedJob && selectedAge && selectedGender
                ? 'bg-gray-800 text-white hover:bg-black hover:scale-105 shadow-xl cursor-pointer'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            다음 <span className="text-xl lg:text-2xl">👉</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Selection;
