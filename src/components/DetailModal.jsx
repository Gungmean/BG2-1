import React from 'react';
import { X, Calendar, Clock, Pin, Trash2, Edit3, Image as ImageIcon, FileText, Building2 } from 'lucide-react';
import { calculateDDay } from '../services/storageService';

export default function DetailModal({
  notice,
  isMonitor,
  onClose,
  onEdit,
  onDelete,
  onTogglePin,
  onOpenPinModal
}) {
  if (!notice) return null;

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

          {/* Image if available */}
          {notice.imageUrl && (
            <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 max-h-80 flex items-center justify-center">
              <img
                src={notice.imageUrl}
                alt={notice.title}
                className="w-full h-full object-contain max-h-80"
              />
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
