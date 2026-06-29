import React, { useEffect, useRef, useState } from 'react';

interface CameraProps {
  onCapture: (imageSrc: string) => void;
}

const Camera: React.FC<CameraProps> = ({ onCapture }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState('');

  useEffect(() => {
    let stream: MediaStream | null = null;

    const startCamera = async () => {
      try {
        if (!navigator.mediaDevices?.getUserMedia) {
          setCameraError('이 브라우저는 카메라를 지원하지 않아요.');
          return;
        }
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', width: { ideal: 1920 }, height: { ideal: 1080 } },
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          setIsCameraReady(true);
          setCameraError('');
        }
      } catch (err) {
        console.error('Camera access denied or error:', err);
        const name = err instanceof DOMException ? err.name : '';
        if (name === 'NotAllowedError' || name === 'PermissionDeniedError') {
          setCameraError('카메라 접근이 거부되었어요.\n설정에서 카메라 권한을 허용해 주세요.');
        } else if (name === 'NotFoundError' || name === 'DevicesNotFoundError') {
          setCameraError('카메라를 찾을 수 없어요.\n웹캠이 연결되어 있는지 확인해 주세요.');
        } else {
          setCameraError('카메라를 시작할 수 없어요.\n잠시 후 다시 시도해 주세요.');
        }
      }
    };

    startCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const takePhoto = () => {
    if (countdown !== null || cameraError) return;

    setCountdown(3);

    let counter = 3;
    const interval = setInterval(() => {
      counter -= 1;
      setCountdown(counter);

      if (counter === 0) {
        clearInterval(interval);
        captureFrame();
        setTimeout(() => setCountdown(null), 500);
      }
    }, 1000);
  };

  const captureFrame = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        const imageSrc = canvas.toDataURL('image/jpeg', 0.8);
        onCapture(imageSrc);
      }
    }
  };

  return (
    <div className="flex flex-col items-center justify-center w-full min-h-screen lg:h-full px-4 py-20 lg:p-8 lg:pt-16 animate-fade-in">
      <div className="relative w-full max-w-[1200px] rounded-2xl lg:rounded-[3rem] overflow-hidden border-8 lg:border-[16px] border-white shadow-[0_20px_50px_rgba(0,0,0,0.1)] bg-gray-100 aspect-[3/4] sm:aspect-[3/4] lg:h-[80vh] lg:w-auto mx-auto flex items-center justify-center">

        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover transform -scale-x-100 bg-gray-900"
        />

        {isCameraReady && countdown === null && !cameraError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none opacity-40">
            <svg
              width="600"
              height="750"
              viewBox="0 0 100 120"
              className="w-[45%] max-w-[280px] lg:w-[600px] lg:max-w-none h-auto stroke-white drop-shadow-md"
            >
              <ellipse cx="50" cy="35" rx="25" ry="30" fill="none" strokeWidth="2" strokeDasharray="4 4" />
              <path d="M 10 120 Q 10 80 50 80 Q 90 80 90 120" fill="none" strokeWidth="2" strokeDasharray="4 4" />
            </svg>
            <div className="absolute bottom-4 lg:bottom-10 text-white font-bold text-base lg:text-3xl drop-shadow-md bg-black/30 px-4 py-1.5 lg:px-6 lg:py-2 rounded-full">
              선에 맞춰서 서주세요!
            </div>
          </div>
        )}

        <canvas ref={canvasRef} className="hidden" />

        {cameraError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-100 px-6 text-center gap-4">
            <span className="text-5xl">📷</span>
            <p className="text-base lg:text-xl text-red-500 font-bold whitespace-pre-line leading-relaxed">
              {cameraError}
            </p>
            <p className="text-sm text-gray-400">관리자에게 문의해 주세요</p>
          </div>
        )}

        {!isCameraReady && !cameraError && (
          <div className="absolute inset-0 flex items-center justify-center text-base lg:text-2xl text-gray-400 font-bold bg-gray-100 px-4 text-center">
            카메라를 준비하고 있어요...
          </div>
        )}

        {countdown !== null && countdown > 0 && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-sm transition-all rounded-xl lg:rounded-3xl">
            <span className="text-[6rem] sm:text-[10rem] lg:text-[20rem] font-black text-white drop-shadow-[0_10px_30px_rgba(0,0,0,0.3)] animate-ping">
              {countdown}
            </span>
          </div>
        )}

        {countdown === 0 && (
          <div className="absolute inset-0 bg-white animate-flash z-50 rounded-xl lg:rounded-3xl"></div>
        )}
      </div>

      <button
        onClick={takePhoto}
        disabled={!isCameraReady || countdown !== null || !!cameraError}
        className={`mt-6 lg:mt-12 px-10 py-5 lg:px-20 lg:py-8 rounded-full text-xl lg:text-4xl font-black transition-all duration-300 flex items-center gap-3 lg:gap-4 w-full sm:w-auto justify-center ${
          isCameraReady && countdown === null && !cameraError
            ? 'bg-gray-800 text-white hover:bg-black hover:scale-105 shadow-xl cursor-pointer'
            : 'bg-gray-200 text-gray-400 cursor-not-allowed'
        }`}
      >
        <span className="text-3xl lg:text-5xl">📷</span> 찰칵! 촬영하기
      </button>
    </div>
  );
};

export default Camera;
