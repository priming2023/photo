import { useState, useEffect, useCallback } from 'react';
import Home from './components/Home';
import Selection from './components/Selection';
import Camera from './components/Camera';
import Processing from './components/Processing';
import Result from './components/Result';
import ViewPage from './components/ViewPage';
import { storeConfig } from './config/store';

const viewId = new URLSearchParams(window.location.search).get('id');
const isViewPage = window.location.pathname.startsWith('/view') && !!viewId;

const IDLE_TIMEOUT_MS = 45_000;

export type ScreenState = 'HOME' | 'SELECTION' | 'CAMERA' | 'PROCESSING' | 'RESULT';

function App() {
  const [screen, setScreen] = useState<ScreenState>('HOME');
  const [selections, setSelections] = useState({ job: '', age: '', gender: '' });
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [transformedImage, setTransformedImage] = useState<string | null>(null);

  const handleReset = useCallback(() => {
    setScreen('HOME');
    setSelections({ job: '', age: '', gender: '' });
    setCapturedImage(null);
    setTransformedImage(null);
  }, []);

  // 유휴 시 자동 홈 복귀 (Processing 중 제외)
  useEffect(() => {
    if (isViewPage) return;

    let timer: ReturnType<typeof setTimeout>;

    const resetIdle = () => {
      clearTimeout(timer);
      if (screen !== 'HOME' && screen !== 'PROCESSING') {
        timer = setTimeout(handleReset, IDLE_TIMEOUT_MS);
      }
    };

    window.addEventListener('pointerdown', resetIdle);
    window.addEventListener('keydown', resetIdle);
    resetIdle();

    return () => {
      clearTimeout(timer);
      window.removeEventListener('pointerdown', resetIdle);
      window.removeEventListener('keydown', resetIdle);
    };
  }, [screen, handleReset]);

  if (isViewPage) {
    return <ViewPage sessionId={viewId!} />;
  }

  return (
    <div className="w-screen min-h-screen lg:h-screen bg-[#FDFBF7] text-gray-800 font-sans overflow-x-hidden overflow-y-auto lg:overflow-hidden relative selection:bg-blue-200">

      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-100/50 blur-[100px] rounded-full pointer-events-none z-0"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-rose-100/50 blur-[100px] rounded-full pointer-events-none z-0"></div>

      {screen !== 'HOME' && (
        <div className="absolute top-4 left-4 lg:top-8 lg:left-10 z-50 font-black text-base lg:text-2xl tracking-widest text-gray-800">
          월드킹 <span className="font-medium text-gray-500">{storeConfig.branch}</span>
        </div>
      )}

      {screen !== 'HOME' && (
        <button
          onClick={handleReset}
          className="absolute top-4 right-4 lg:top-8 lg:right-10 z-50 bg-white/80 backdrop-blur-md px-4 py-2 lg:px-6 lg:py-3 rounded-full border border-gray-200 shadow-sm font-bold text-sm lg:text-base text-gray-600 hover:bg-gray-80 hover:text-gray-900 transition-all flex items-center gap-2 hover:scale-105"
        >
          <span className="text-lg lg:text-xl">🏠</span> 처음으로
        </button>
      )}

      <div className="z-10 w-full min-h-screen lg:h-full relative flex flex-col">
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
            onRetry={() => setScreen('CAMERA')}
          />
        )}

        {screen === 'RESULT' && capturedImage && (
          <Result
            originalImage={capturedImage}
            transformedImage={transformedImage || undefined}
            job={selections.job}
            age={selections.age}
            gender={selections.gender}
            onRetake={() => {
              setCapturedImage(null);
              setTransformedImage(null);
              setScreen('CAMERA');
            }}
            onPrintComplete={handleReset}
          />
        )}
      </div>
    </div>
  );
}

export default App;
