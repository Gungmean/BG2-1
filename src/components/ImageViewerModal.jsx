import React, { useState, useEffect, useCallback } from 'react';
import { X, ChevronLeft, ChevronRight, Download, ZoomIn, ZoomOut, RotateCw } from 'lucide-react';

/**
 * 전체화면 이미지 확대 및 저장(다운로드) 모달 컴포넌트
 * @param {boolean} isOpen - 모달 열림 여부
 * @param {string[]} images - 이미지 URL 배열
 * @param {number} initialIndex - 초기 열릴 이미지 인덱스
 * @param {string} title - 게시물 제목 (다운로드 파일명 생성 시 활용)
 * @param {function} onClose - 모달 닫기 핸들러
 */
export default function ImageViewerModal({
  isOpen,
  images = [],
  initialIndex = 0,
  title = '학교게시판_사진',
  onClose,
}) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isZoomed, setIsZoomed] = useState(false);
  const [rotation, setRotation] = useState(0);

  // 초기 인덱스 반영 및 상태 리셋
  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(Math.max(0, Math.min(initialIndex, images.length - 1)));
      setIsZoomed(false);
      setRotation(0);
    }
  }, [isOpen, initialIndex, images.length]);

  const handlePrev = useCallback(() => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
    setIsZoomed(false);
    setRotation(0);
  }, [images.length]);

  const handleNext = useCallback(() => {
    setCurrentIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
    setIsZoomed(false);
    setRotation(0);
  }, [images.length]);

  // 키보드 단축키 (ESC: 닫기, 좌/우 화살표: 사진 넘기기)
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowLeft') {
        handlePrev();
      } else if (e.key === 'ArrowRight') {
        handleNext();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, handlePrev, handleNext]);

  if (!isOpen || !images || images.length === 0) return null;

  const currentImage = images[currentIndex];

  // 이미지 다운로드(저장) 처리
  const handleDownload = async (e) => {
    e.stopPropagation();
    try {
      // 파일 이름 정제 (특수문자 제거)
      const safeTitle = (title || '사진')
        .replace(/[/\\?%*:|"<>]/g, '_')
        .slice(0, 30);
      const fileName = `${safeTitle}_사진${currentIndex + 1}.jpg`;

      // data: URL인 경우 직접 다운로드 링크 생성
      if (currentImage.startsWith('data:')) {
        const link = document.createElement('a');
        link.href = currentImage;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        return;
      }

      // 일반 HTTP URL인 경우 fetch로 blob 변환 후 다운로드
      const response = await fetch(currentImage, { mode: 'cors' });
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.warn('직접 다운로드 실패, 새 탭 열기로 대체합니다.', err);
      // 보안 CORS 제한 등으로 실패 시 새 탭에서 열기
      const win = window.open(currentImage, '_blank');
      if (!win) {
        alert('다운로드를 위해 팝업 차단을 해제해주세요.');
      }
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col bg-black/95 backdrop-blur-md select-none animate-fade-in"
      onClick={onClose}
    >
      {/* 상단 툴바 */}
      <div
        className="w-full flex items-center justify-between px-4 sm:px-6 py-3 bg-gradient-to-b from-black/80 to-transparent z-20 text-white"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 사진 카운터 & 제목 */}
        <div className="flex items-center gap-3">
          {images.length > 1 && (
            <span className="px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm text-xs font-bold tracking-wider">
              {currentIndex + 1} / {images.length}
            </span>
          )}
          <span className="text-sm font-semibold text-slate-300 truncate max-w-[200px] sm:max-w-md hidden sm:inline">
            {title}
          </span>
        </div>

        {/* 액션 버튼 (회전, 확대, 다운로드, 닫기) */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setRotation((r) => (r + 90) % 360)}
            className="p-2 rounded-full bg-white/10 hover:bg-white/25 transition-colors cursor-pointer text-slate-200"
            title="90도 회전"
          >
            <RotateCw className="w-5 h-5" />
          </button>

          <button
            type="button"
            onClick={() => setIsZoomed((z) => !z)}
            className="p-2 rounded-full bg-white/10 hover:bg-white/25 transition-colors cursor-pointer text-slate-200"
            title={isZoomed ? '원래 크기로 축소' : '확대해서 보기'}
          >
            {isZoomed ? <ZoomOut className="w-5 h-5" /> : <ZoomIn className="w-5 h-5" />}
          </button>

          <button
            type="button"
            onClick={handleDownload}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-md hover:shadow-blue-500/30 cursor-pointer"
            title="기기에 사진 저장"
          >
            <Download className="w-4 h-4" />
            <span>사진 저장</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="p-2 ml-1 rounded-full bg-white/10 hover:bg-white/30 text-white transition-colors cursor-pointer"
            title="닫기 (ESC)"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* 중앙 메인 이미지 영역 */}
      <div
        className="flex-1 relative flex items-center justify-center p-2 sm:p-6 overflow-hidden"
        onClick={(e) => {
          // 배경 빈 공간 클릭 시에만 닫히도록
          if (e.target === e.currentTarget) onClose();
        }}
      >
        {/* 이전 사진 버튼 */}
        {images.length > 1 && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handlePrev();
            }}
            className="absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/50 hover:bg-black/80 text-white/90 hover:text-white transition-all backdrop-blur-sm z-20 cursor-pointer shadow-lg hover:scale-110"
            aria-label="이전 사진"
          >
            <ChevronLeft className="w-7 h-7 sm:w-8 sm:h-8" />
          </button>
        )}

        {/* 메인 이미지 */}
        <div
          className={`transition-transform duration-200 flex items-center justify-center max-w-full max-h-full ${
            isZoomed ? 'cursor-zoom-out scale-150 overflow-auto' : 'cursor-zoom-in'
          }`}
          onClick={(e) => {
            e.stopPropagation();
            setIsZoomed((z) => !z);
          }}
          style={{ transform: `rotate(${rotation}deg) ${isZoomed ? 'scale(1.6)' : 'scale(1)'}` }}
        >
          <img
            src={currentImage}
            alt={`${title} - ${currentIndex + 1}`}
            className="max-w-full max-h-[80vh] object-contain rounded-lg shadow-2xl transition-all"
            draggable={false}
          />
        </div>

        {/* 다음 사진 버튼 */}
        {images.length > 1 && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleNext();
            }}
            className="absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/50 hover:bg-black/80 text-white/90 hover:text-white transition-all backdrop-blur-sm z-20 cursor-pointer shadow-lg hover:scale-110"
            aria-label="다음 사진"
          >
            <ChevronRight className="w-7 h-7 sm:w-8 sm:h-8" />
          </button>
        )}
      </div>

      {/* 하단 썸네일 스트립 (사진이 2장 이상일 때 표시) */}
      {images.length > 1 && (
        <div
          className="w-full py-3 px-4 flex items-center justify-center gap-2 overflow-x-auto bg-gradient-to-t from-black/80 to-transparent z-20"
          onClick={(e) => e.stopPropagation()}
        >
          {images.map((img, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                setCurrentIndex(idx);
                setIsZoomed(false);
                setRotation(0);
              }}
              className={`w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden shrink-0 border-2 transition-all cursor-pointer ${
                idx === currentIndex
                  ? 'border-blue-500 scale-105 ring-2 ring-blue-400/50 shadow-lg'
                  : 'border-white/30 opacity-60 hover:opacity-100 hover:border-white/70'
              }`}
            >
              <img
                src={img}
                alt={`미리보기 ${idx + 1}`}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
