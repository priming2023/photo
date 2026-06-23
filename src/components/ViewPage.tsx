import React, { useEffect, useState } from 'react';
import { getPhotoSession, PhotoSession } from '../utils/photoSession';

interface ViewPageProps {
  sessionId: string;
}

const ViewPage: React.FC<ViewPageProps> = ({ sessionId }) => {
  const [session, setSession] = useState<PhotoSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    getPhotoSession(sessionId).then((data) => {
      setSession(data);
      setLoading(false);
    });
  }, [sessionId]);

  const isExpired = session ? new Date(session.expires_at) < new Date() : false;

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('ko-KR', {
      year: 'numeric', month: 'long', day: 'numeric',
    });

  const handleDownload = async () => {
    if (!session || downloading) return;
    setDownloading(true);
    try {
      const res = await fetch(session.transformed_url);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `미래의나_${session.job}_${session.age}.jpg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      alert('다운로드에 실패했습니다. 이미지를 길게 눌러 저장해 주세요.');
    } finally {
      setDownloading(false);
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      alert('링크를 복사할 수 없습니다.');
    }
  };

  // ── 로딩 ─────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500 font-medium">사진 불러오는 중...</p>
        </div>
      </div>
    );
  }

  // ── 오류 / 만료 ───────────────────────────────────────────────────────────
  if (!session || isExpired) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-slate-100 flex items-center justify-center px-6">
        <div className="text-center max-w-sm">
          <div className="text-6xl mb-6">😔</div>
          <h2 className="text-2xl font-black text-gray-800 mb-3">
            {isExpired ? '이미지가 만료됐어요' : '사진을 찾을 수 없어요'}
          </h2>
          <p className="text-gray-500 leading-relaxed">
            {isExpired
              ? '보관 기간(30일)이 지나 이미지가 삭제됐습니다.'
              : 'QR 코드가 올바른지 다시 확인해 주세요.'}
          </p>
          <p className="mt-6 text-sm text-gray-400">월드킹 당진서산점</p>
        </div>
      </div>
    );
  }

  // ── 성공 ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950">
      {/* 상단 브랜드 */}
      <div className="px-6 pt-8 pb-4 text-center">
        <p className="text-blue-300/70 text-sm font-medium tracking-widest uppercase">
          월드킹 당진서산점
        </p>
        <h1 className="text-white text-2xl font-black mt-1">미래의 내 모습</h1>
      </div>

      {/* 직업·나이 배지 */}
      <div className="flex justify-center gap-3 px-6 mb-5">
        <span className="bg-blue-500/30 border border-blue-400/40 text-blue-200 px-4 py-1.5 rounded-full text-sm font-bold backdrop-blur-sm">
          {session.age}
        </span>
        <span className="bg-indigo-500/30 border border-indigo-400/40 text-indigo-200 px-4 py-1.5 rounded-full text-sm font-bold backdrop-blur-sm">
          {session.job}
        </span>
      </div>

      {/* 메인 이미지 */}
      <div className="px-4">
        <div className="relative rounded-3xl overflow-hidden shadow-2xl shadow-black/50 border border-white/10">
          <img
            src={session.transformed_url}
            alt={`미래의 나 - ${session.age} ${session.job}`}
            className="w-full object-cover"
            style={{ maxHeight: '70vh' }}
          />
          {/* 하단 그라디언트 오버레이 */}
          <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-black/60 to-transparent" />
          <div className="absolute bottom-4 left-5 right-5 flex items-end justify-between">
            <div>
              <p className="text-white/60 text-xs">촬영일</p>
              <p className="text-white font-bold text-sm">{formatDate(session.created_at)}</p>
            </div>
            <p className="text-white/50 text-xs text-right">
              {formatDate(session.expires_at)}까지<br />보관
            </p>
          </div>
        </div>
      </div>

      {/* 액션 버튼 */}
      <div className="px-4 mt-6 pb-10 flex flex-col gap-3">
        <button
          onClick={handleDownload}
          disabled={downloading}
          className="w-full py-4 bg-white text-gray-900 font-black text-lg rounded-2xl shadow-lg active:scale-95 transition-all disabled:opacity-60 flex items-center justify-center gap-2"
        >
          {downloading ? (
            <>
              <div className="w-5 h-5 border-2 border-gray-400 border-t-gray-800 rounded-full animate-spin" />
              다운로드 중...
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              사진 저장하기
            </>
          )}
        </button>

        <button
          onClick={handleCopyLink}
          className="w-full py-4 bg-white/10 border border-white/20 text-white font-bold text-base rounded-2xl active:scale-95 transition-all backdrop-blur-sm flex items-center justify-center gap-2"
        >
          {copied ? (
            <>
              <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-green-400">링크 복사 완료!</span>
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              링크 공유하기
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default ViewPage;
