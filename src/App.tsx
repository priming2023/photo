import { useState } from 'react';
import Home from './components/Home';
import Selection from './components/Selection';
import Camera from './components/Camera';
import Processing from './components/Processing';
import Result from './components/Result';
import ViewPage from './components/ViewPage';

// /view?id=xxx → QR 스캔 후 모바일 뷰 페이지로 라우팅
const viewId = new URLSearchParams(window.location.search).get('id');
const isViewPage = window.location.pathname.startsWith('/view') && !!viewId;

export type ScreenState = 'HOME' | 'SELECTION' | 'CAMERA' | 'PROCESSING' | 'RESULT';

function App() {
  // hooks는 항상 최상단에서 호출 (rules of hooks 준수)
  const [screen, setScreen] = useState<ScreenState>('HOME');
  const [selections, setSelections] = useState({ job: '', age: '', gender: '' });
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [transformedImage, setTransformedImage] = useState<string | null>(null);

  // QR 스캔으로 접근한 경우 뷰 페이지 렌더링 (hooks 호출 후 조건부 return)
  if (isViewPage) {
    return <ViewPage sessionId={viewId!} />;
  }

  const handleReset = () => {
    setScreen('HOME');
    setSelections({ job: '', age: '', gender: '' });
    setCapturedImage(null);
    setTransformedImage(null);
  };

  return (
    <div className="w-screen h-screen bg-[#FDFBF7] text-gray-800 font-sans overflow-hidden relative selection:bg-blue-200">
      
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-100/50 blur-[100px] rounded-full pointer-events-none z-0"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-rose-100/50 blur-[100px] rounded-full pointer-events-none z-0"></div>

      {screen !== 'HOME' && (
        <div className="absolute top-8 left-10 z-50 font-black text-2xl tracking-widest text-gray-800">
          월드킹 <span className="font-medium text-gray-500">당진서산점</span>
        </div>
      )}

      {screen !== 'HOME' && (
        <button 
          onClick={handleReset} 
          className="absolute top-8 right-10 z-50 bg-white/80 backdrop-blur-md px-6 py-3 rounded-full border border-gray-200 shadow-sm font-bold text-gray-600 hover:bg-gray-80 hover:text-gray-900 transition-all flex items-center gap-2 hover:scale-105"
        >
          <span className="text-xl">🏠</span> 처음으로
        </button>
      )}

      <div className="z-10 w-full h-full relative flex flex-col">
        {screen === 'HOME' && <Home onStart={() => setScreen('SELECTION')} />}
        
        {screen === 'SELECTION' && (
          <Selection 
            onComplete={(job, age, gender) => {
              setSelections({ job, age, gender });
              setScreen('CAMERA');
            }} 
          />
        )}

        {screen === 'CAMERA' && (
          <Camera 
            onCapture={(imageSrc) => {
              setCapturedImage(imageSrc);
              setScreen('PROCESSING');
            }}
          />
        )}

        {screen === 'PROCESSING' && capturedImage && (
          <Processing 
            job={selections.job} 
            age={selections.age} 
            gender={selections.gender}
            originalImage={capturedImage}
            onFinish={(resultImage) => {
              setTransformedImage(resultImage || null); 
              setScreen('RESULT');
            }} 
          />
        )}

        {screen === 'RESULT' && capturedImage && (
          <Result 
            originalImage={capturedImage}
            transformedImage={transformedImage || undefined}
            job={selections.job}
            age={selections.age}
            onRetake={() => {
              setCapturedImage(null);
              setTransformedImage(null);
              setScreen('CAMERA');
            }}
            onPrint={() => {
              try {
                const isElectron = window && (window as any).process && (window as any).process.type;
                if (isElectron) {
                  const { ipcRenderer } = (window as any).require('electron');
                  ipcRenderer.send('print-receipt');
                } else {
                  console.log("웹 환경: Electron 인쇄 시뮬레이션");
                }
              } catch (e) {
                console.error("Electron print failed:", e);
              }
              alert("영수증 프린터로 인쇄 명령을 보냈습니다!");
              handleReset();
            }}
          />
        )}
      </div>
    </div>
  );
}

export default App;
