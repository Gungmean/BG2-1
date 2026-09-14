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
    <div className="fixed inset-0 z-50 w-screen h-screen bg-black flex flex-col items-center justify-center overflow-hidden select-none animate-fade-in">
      {/* 1. Fullscreen Video Player */}
      <div className="absolute inset-0 w-full h-full flex items-center justify-center bg-black">
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${video.videoId}?autoplay=1&playsinline=1&rel=0&modestbranding=1&controls=1`}
          title={video.title || 'Special Video'}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          className="w-full h-full border-0"
        />
      </div>

      {/* 2. Floating Top Header Overlay (Over video) */}
      <div className="absolute top-0 left-0 right-0 z-20 p-4 sm:p-6 flex items-center justify-between gap-3 bg-gradient-to-b from-black/85 via-black/40 to-transparent pointer-events-none">
        {/* Left Badge */}
        <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-2xl bg-black/70 backdrop-blur-md border border-amber-500/40 text-amber-300 shadow-2xl pointer-events-auto">
          <Sparkles className="w-4 h-4 text-amber-400 shrink-0 animate-pulse" />
          <span className="text-xs sm:text-sm font-black tracking-tight drop-shadow">
            {video.title || '등장 영상'}
          </span>
        </div>

        {/* Right Close / Skip Button */}
        <button
          type="button"
          onClick={onClose}
          title="닫기 / 스킵 (ESC)"
          className="pointer-events-auto flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-black/70 hover:bg-rose-600/90 text-white font-extrabold text-xs transition-all border border-white/20 hover:border-rose-400/50 shadow-2xl backdrop-blur-md cursor-pointer group"
        >
          <span>닫기 / 스킵</span>
          <X className="w-4 h-4 group-hover:rotate-90 transition-transform duration-200" />
        </button>
      </div>

      {/* 3. Floating Bottom Hint */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 pointer-events-none hidden sm:block">
        <span className="px-3.5 py-1.5 rounded-full bg-black/60 backdrop-blur-sm text-[11px] text-white/75 border border-white/10 shadow-lg">
          키보드 <strong className="text-amber-300">ESC</strong> 또는 우측 상단 <strong className="text-amber-300">[닫기 / 스킵]</strong>으로 언제든 건너뛸 수 있습니다
        </span>
      </div>
    </div>
  );
}
