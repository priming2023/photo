import React, { useEffect, useState } from 'react';
import { getPhotoSession, PhotoSession } from '../utils/photoSession';
import { storeDisplayName } from '../config/store';
import {
  createComparisonImage,
  saveImageToGallery,
  fetchImageBlob,
} from '../utils/viewImageUtils';

interface ViewPageProps {
  sessionId: string;
}

const ViewPage: React.FC<ViewPageProps> = ({ sessionId }) => {
  const [session, setSession] = useState<PhotoSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveHint, setSaveHint] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    getPhotoSession(sessionId).then((data) => {
      setSession(data);
      setLoading(false);
    });
  }, [sessionId]);

  const isExpired = session ? new Date(session.expires_at) < new Date() : false;
  const hasBoth = !!(session?.original_url && session.original_url !== session.transformed_url);

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('ko-KR', {
      year: 'numeric', month: 'long', day: 'numeric',
    });

  const handleSaveComparison = async () => {
    if (!session || saving) return;
    setSaving(true);
    setSaveHint('');

    try {
      const original = session.original_url || session.transformed_url;
      const blob = hasBoth
        ? await createComparisonImage(original, session.transformed_url, session.job, session.age)
        : await fetchImageBlob(session.transformed_url);

      const filename = `미래의나_${session.job}_${session.age}.jpg`;
      const method = await saveImageToGallery(blob, filename);

      setSaveHint(
        method === 'gallery'
          ? '공유 메뉴에서 "사진에 저장" 또는 "갤러리에 저장"을 눌러 주세요'
          : '다운로드 폴더에 저장됐어요. 갤러리 앱에서 확인해 주세요',
      );
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return;
      alert('저장에 실패했어요. 사진을 길게 눌러 저장해 주세요.');
    } finally {
      setSaving(false);
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
              ? '보관 기간(14일)이 지나 이미지가 삭제됐습니다.'
              : 'QR 코드가 올바른지 다시 확인해 주세요.'}
          </p>
          <p className="mt-6 text-sm text-gray-400">{storeDisplayName()}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950 pb-10">
      <div className="px-6 pt-8 pb-4 text-center">
        <p className="text-blue-300/70 text-sm font-medium tracking-widest uppercase">
          {storeDisplayName()}
        </p>
        <h1 className="text-white text-2xl font-black mt-1">미래의 내 모습</h1>
      </div>

      <div className="flex justify-center gap-3 px-6 mb-5">
        <span className="bg-blue-500/30 border border-blue-400/40 text-blue-200 px-4 py-1.5 rounded-full text-sm font-bold backdrop-blur-sm">
          {session.age}
        </span>
        <span className="bg-indigo-500/30 border border-indigo-400/40 text-indigo-200 px-4 py-1.5 rounded-full text-sm font-bold backdrop-blur-sm">
          {session.job}
        </span>
      </div>

      {/* 현재 + 미래 컬러 사진 */}
      <div className="px-4">
        {hasBoth ? (
          <div className="grid grid-cols-2 gap-3">
            <div className="relative rounded-2xl overflow-hidden shadow-xl border border-white/10 bg-black/20">
              <div className="absolute top-2 left-2 z-10 bg-black/50 text-white text-xs font-bold px-2.5 py-1 rounded-full backdrop-blur-sm">
                현재의 나
              </div>
              <img
                src={session.original_url!}
                alt="현재의 나"
                className="w-full aspect-[3/4] object-cover -scale-x-100"
              />
            </div>
            <div className="relative rounded-2xl overflow-hidden shadow-xl border border-blue-400/30 bg-black/20">
              <div className="absolute top-2 left-2 z-10 bg-blue-500/80 text-white text-xs font-bold px-2.5 py-1 rounded-full backdrop-blur-sm">
                미래의 나
              </div>
              <img
                src={session.transformed_url}
                alt="미래의 나"
                className="w-full aspect-[3/4] object-cover -scale-x-100"
              />
            </div>
          </div>
        ) : (
          <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-white/10">
            <img
              src={session.transformed_url}
              alt={`미래의 나 - ${session.age} ${session.job}`}
              className="w-full object-cover -scale-x-100"
              style={{ maxHeight: '70vh' }}
            />
          </div>
        )}

        <div className="flex justify-between items-center mt-4 px-1 text-xs text-white/50">
          <span>촬영 {formatDate(session.created_at)}</span>
          <span>{formatDate(session.expires_at)}까지 보관</span>
        </div>
      </div>

      <div className="px-4 mt-6 flex flex-col gap-3">
        <button
          onClick={handleSaveComparison}
          disabled={saving}
          className="w-full py-4 bg-white text-gray-900 font-black text-lg rounded-2xl shadow-lg active:scale-95 transition-all disabled:opacity-60 flex items-center justify-center gap-2"
        >
          {saving ? (
            <>
              <div className="w-5 h-5 border-2 border-gray-400 border-t-gray-800 rounded-full animate-spin" />
              저장 준비 중...
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              {hasBoth ? '두 장 합쳐서 갤러리에 저장' : '사진 갤러리에 저장'}
            </>
          )}
        </button>

        {saveHint && (
          <p className="text-center text-green-300 text-sm px-2">{saveHint}</p>
        )}

        <p className="text-center text-white/40 text-xs px-4">
          iPhone: 공유 → 사진에 저장 · Android: 공유 → 갤러리/사진 앱
        </p>

        <button
          onClick={handleCopyLink}
          className="w-full py-4 bg-white/10 border border-white/20 text-white font-bold text-base rounded-2xl active:scale-95 transition-all backdrop-blur-sm flex items-center justify-center gap-2"
        >
          {copied ? (
            <span className="text-green-400">링크 복사 완료!</span>
          ) : (
            '링크 공유하기'
          )}
        </button>
      </div>
    </div>
  );
};

export default ViewPage;
