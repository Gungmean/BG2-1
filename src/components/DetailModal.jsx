import React, { useState, useEffect } from 'react';
import {
  X,
  Calendar,
  Clock,
  Pin,
  Trash2,
  Edit3,
  Image as ImageIcon,
  FileText,
  Building2,
  ZoomIn,
  Download,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { calculateDDay } from '../services/storageService';
import ImageViewerModal from './ImageViewerModal';

export default function DetailModal({
  notice,
  isMonitor,
  onClose,
  onEdit,
  onDelete,
  onTogglePin,
  onOpenPinModal,
}) {
  if (!notice) return null;

  // Multi-image list normalization
  const imageList = Array.isArray(notice.imageUrls) && notice.imageUrls.length > 0
    ? notice.imageUrls
    : (notice.imageUrl ? [notice.imageUrl] : []);

  const [selectedImgIndex, setSelectedImgIndex] = useState(0);
  const [isViewerOpen, setIsViewerOpen] = useState(false);

  // Reset index when viewing a new notice
  useEffect(() => {
    setSelectedImgIndex(0);
    setIsViewerOpen(false);
  }, [notice.id]);

  // Single image download helper
  const handleDownloadCurrent = async () => {
    const currentImg = imageList[selectedImgIndex];
    if (!currentImg) return;

    try {
      const safeTitle = (notice.title || '사진')
        .replace(/[/\\?%*:|"<>]/g, '_')
        .slice(0, 30);
      const fileName = `${safeTitle}_사진${selectedImgIndex + 1}.jpg`;

      if (currentImg.startsWith('data:')) {
        const link = document.createElement('a');
        link.href = currentImg;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        return;
      }

      const response = await fetch(currentImg, { mode: 'cors' });
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
      window.open(currentImg, '_blank');
    }
  };

  const dday = calculateDDay(notice);
  const displayDateText =
    notice.dateType === 'none' || (!notice.date && !notice.startDate && !notice.endDate)
      ? '기한 없음 (상시)'
      : notice.dateType === 'range' && notice.startDate && notice.endDate
      ? `${notice.startDate} ~ ${notice.endDate}`
      : notice.date || notice.startDate || '기한 없음';

  const handleDeleteClick = () => {
    if (!isMonitor) {
      if (window.confirm('게시물 삭제는 반장 권한이 필요합니다. 반장 인증 창으로 이동하시겠습니까?')) {
        onClose();
        onOpenPinModal && onOpenPinModal();
      }
    } else {
      onClose();
      onDelete(notice.id);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fade-in">
      <div className="bg-white dark:bg-slate-900 w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden border border-slate-100 dark:border-slate-800 flex flex-col max-h-[85vh] transition-colors">
        {/* Header */}
        <div className="px-5 py-3.5 bg-slate-50 dark:bg-slate-850 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 bg-indigo-100 dark:bg-indigo-950/70 text-indigo-800 dark:text-indigo-300 rounded-md text-xs font-bold">
              {notice.category}
            </span>
            {dday.isExpired ? (
              <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                {dday.text}
              </span>
            ) : dday.text === '진행 중' ? (
              <span className="px-2.5 py-0.5 rounded-md text-[11px] font-extrabold bg-emerald-600 text-white flex items-center gap-1 shadow-xs">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                진행 중
              </span>
            ) : dday.text === '오늘 종료' || dday.days === 0 ? (
              <span className="px-2.5 py-0.5 rounded-md text-[11px] font-extrabold bg-rose-600 text-white animate-pulse shadow-xs">
                {dday.text}
              </span>
            ) : dday.text === '기한 없음' ? (
              <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                상시
              </span>
            ) : dday.days <= 3 ? (
              <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-amber-500 text-white shadow-xs">
                {dday.text}
              </span>
            ) : (
              <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-blue-600 text-white shadow-xs">
                {dday.text}
              </span>
            )}
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-4">
          {/* Title */}
          <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-slate-100 leading-snug">
            {notice.title}
          </h2>

          {/* Meta Info */}
          <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-slate-500 dark:text-slate-400 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>마감/일시: <strong className="text-slate-800 dark:text-slate-200">{displayDateText}</strong></span>
            </div>
          </div>

          {/* Image Gallery if available */}
          {imageList.length > 0 && (
            <div className="space-y-2">
              <div className="relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-900/5 dark:bg-slate-950 flex items-center justify-center max-h-96 group select-none">
                {/* 메인 이미지 */}
                <img
                  src={imageList[selectedImgIndex]}
                  alt={`${notice.title} - ${selectedImgIndex + 1}`}
                  onClick={() => setIsViewerOpen(true)}
                  className="w-full h-full object-contain max-h-96 cursor-zoom-in transition-transform duration-200 group-hover:scale-[1.01]"
                />

                {/* 다중 사진일 때 좌/우 넘기기 버튼 */}
                {imageList.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedImgIndex((prev) => (prev > 0 ? prev - 1 : imageList.length - 1));
                      }}
                      className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 hover:bg-black/80 text-white/90 hover:text-white transition-all backdrop-blur-xs opacity-0 group-hover:opacity-100 cursor-pointer shadow-md"
                      title="이전 사진"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedImgIndex((prev) => (prev < imageList.length - 1 ? prev + 1 : 0));
                      }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 hover:bg-black/80 text-white/90 hover:text-white transition-all backdrop-blur-xs opacity-0 group-hover:opacity-100 cursor-pointer shadow-md"
                      title="다음 사진"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </>
                )}

                {/* 상단 오버레이 툴바: 사진 카운터 & 액션 버튼 (확대, 저장) */}
                <div className="absolute top-2.5 inset-x-2.5 flex items-center justify-between pointer-events-none">
                  {imageList.length > 1 ? (
                    <span className="px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-xs text-white text-[11px] font-bold shadow-xs pointer-events-auto">
                      {selectedImgIndex + 1} / {imageList.length}
                    </span>
                  ) : <span />}

                  <div className="flex items-center gap-1.5 pointer-events-auto">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDownloadCurrent();
                      }}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/60 hover:bg-blue-600 text-white text-[11px] font-bold transition-all backdrop-blur-xs shadow-xs cursor-pointer"
                      title="이 사진 기기에 저장"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>저장</span>
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsViewerOpen(true);
                      }}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/60 hover:bg-black/90 text-white text-[11px] font-bold transition-all backdrop-blur-xs shadow-xs cursor-pointer"
                      title="크게 확대해서 보기"
                    >
                      <ZoomIn className="w-3.5 h-3.5" />
                      <span>확대</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* 사진이 여러 장일 경우 하단 썸네일 스트립 */}
              {imageList.length > 1 && (
                <div className="flex items-center gap-2 overflow-x-auto py-1 px-0.5">
                  {imageList.map((img, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setSelectedImgIndex(idx)}
                      className={`w-14 h-14 rounded-xl overflow-hidden shrink-0 border-2 transition-all cursor-pointer ${
                        idx === selectedImgIndex
                          ? 'border-blue-600 ring-2 ring-blue-400/40 scale-105 shadow-sm'
                          : 'border-slate-200 dark:border-slate-700 opacity-60 hover:opacity-100 hover:border-slate-400'
                      }`}
                    >
                      <img
                        src={img}
                        alt={`썸네일 ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Full Text Content */}
          <div className="bg-slate-50 dark:bg-slate-850 p-4 rounded-xl border border-slate-200/70 dark:border-slate-800">
            <h3 className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
              <span>상세 안내 내용</span>
            </h3>
            <p className="text-sm text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-wrap">
              {notice.content}
            </p>
          </div>
        </div>

        {/* ImageViewerModal for Fullscreen Zoom and Actions */}
        <ImageViewerModal
          isOpen={isViewerOpen}
          images={imageList}
          initialIndex={selectedImgIndex}
          title={notice.title}
          onClose={() => setIsViewerOpen(false)}
        />

        {/* Modal Footer & Actions */}
        <div className="px-5 py-3 bg-slate-50 dark:bg-slate-850 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="text-[11px] text-slate-400 dark:text-slate-500 flex items-center gap-1">
            {notice.isSchoolEvent ? (
              <>
                <Building2 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 inline" />
                <span>나이스(NEIS) 공식 학사일정</span>
              </>
            ) : (
              <span>게시글 #{notice.id}</span>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            {!notice.isSchoolEvent && isMonitor && (
              <>
                <button
                  onClick={() => onTogglePin(notice.id)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors ${
                    notice.pinned
                      ? 'bg-indigo-600 text-white'
                      : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-750'
                  }`}
                >
                  <Pin className="w-3 h-3" />
                  <span>{notice.pinned ? '고정 해제' : '상단 고정'}</span>
                </button>
                <button
                  onClick={() => {
                    onClose();
                    onEdit(notice);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-750 transition-colors flex items-center gap-1"
                >
                  <Edit3 className="w-3 h-3" /> 수정
                </button>
              </>
            )}

            {/* Delete Button (Only for classroom notices) */}
            {!notice.isSchoolEvent && (
              <button
                onClick={handleDeleteClick}
                className="px-2.5 py-1 rounded-lg bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 text-xs font-bold hover:bg-rose-100 dark:hover:bg-rose-900/50 transition-colors flex items-center gap-1"
              >
                <Trash2 className="w-3 h-3" /> 삭제
              </button>
            )}

            <button
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-lg bg-slate-800 dark:bg-slate-700 text-white text-xs font-bold hover:bg-slate-900 dark:hover:bg-slate-600 transition-colors"
            >
              닫기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
