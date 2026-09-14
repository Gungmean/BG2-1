import React, { useEffect } from 'react';
import { X, Sparkles, Volume2 } from 'lucide-react';

export default function EasterEggVideoModal({ video, onClose }) {
  useEffect(() => {
    // ESC 키 누르면 영상 모달 닫기
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!video) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-3xl bg-slate-950 border border-amber-500/40 rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header Bar */}
        <div className="px-4 sm:px-6 py-3.5 bg-gradient-to-r from-amber-950/60 via-slate-900 to-slate-950 border-b border-amber-500/30 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/40">
              <Sparkles className="w-4 h-4" />
            </span>
            <div>
              <h3 className="text-sm sm:text-base font-black text-amber-300 flex items-center gap-1.5">
                {video.title || '등장 영상'}
              </h3>
              <p className="text-[11px] text-amber-200/60 font-medium flex items-center gap-1">
                <Volume2 className="w-3 h-3 text-amber-400" />
                <span>스피커 볼륨을 확인해 주세요</span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            title="닫기 (ESC)"
            className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white text-xs font-bold transition-all flex items-center gap-1 border border-white/10 cursor-pointer"
          >
            <span>닫기 / 스킵</span>
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 16:9 YouTube Video Embed Area */}
        <div className="relative w-full aspect-video bg-black">
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${video.videoId}?autoplay=1&playsinline=1&rel=0&modestbranding=1`}
            title={video.title || 'Special Video'}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            className="absolute inset-0 w-full h-full border-0"
          />
        </div>

        {/* Footer Hint */}
        <div className="px-4 py-2.5 bg-slate-950 text-center border-t border-white/5">
          <span className="text-[11px] text-slate-400">
            영상을 다 보셨거나 건너뛰시려면 상단의 <strong className="text-amber-300">[닫기 / 스킵]</strong> 버튼이나 키보드 <strong className="text-amber-300">ESC</strong>를 눌러주세요.
          </span>
        </div>
      </div>
    </div>
  );
}
