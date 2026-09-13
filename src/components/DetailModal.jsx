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
    notice.dateType === 'range' && notice.startDate && notice.endDate
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden border border-slate-100 flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 bg-indigo-100 text-indigo-800 rounded-md text-xs font-bold">
              {notice.category}
            </span>
            {dday.isExpired ? (
              <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-200 text-slate-600">
                {dday.text}
              </span>
            ) : dday.text === '진행 중' ? (
              <span className="px-2.5 py-0.5 rounded-md text-[11px] font-extrabold bg-emerald-600 text-white flex items-center gap-1 shadow-xs">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                진행 중
              </span>
            ) : dday.text === '오늘 종료' || dday.days === 0 ? (
              <span className="px-2 py-0.5 rounded-md text-[11px] font-extrabold bg-rose-600 text-white animate-pulse shadow-xs">
                {dday.text}
              </span>
            ) : dday.days <= 3 ? (
              <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-amber-500 text-white shadow-xs">
                {dday.text}
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-blue-600 text-white shadow-xs">
                {dday.text}
              </span>
            )}
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-slate-200 text-slate-400 hover:text-slate-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-4">
          {/* Title */}
          <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 leading-snug">
            {notice.title}
          </h2>

          {/* Meta Info */}
          <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-slate-500 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-blue-600" />
              <span>마감/일시: <strong className="text-slate-800">{displayDateText}</strong></span>
            </div>
          </div>

          {/* Image if available */}
          {notice.imageUrl && (
            <div className="rounded-xl overflow-hidden border border-slate-200 bg-slate-50 max-h-80 flex items-center justify-center">
              <img
                src={notice.imageUrl}
                alt={notice.title}
                className="w-full h-full object-contain max-h-80"
              />
            </div>
          )}

          {/* Full Text Content */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/70">
            <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-slate-500" />
              <span>상세 안내 내용</span>
            </h3>
            <p className="text-sm text-slate-800 leading-relaxed whitespace-pre-wrap">
              {notice.content}
            </p>
          </div>
        </div>

        {/* Modal Footer & Actions */}
        <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <div className="text-[11px] text-slate-400 flex items-center gap-1">
            {notice.isSchoolEvent ? (
              <>
                <Building2 className="w-3.5 h-3.5 text-blue-600 inline" />
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
                      : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
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
                  className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-100 transition-colors flex items-center gap-1"
                >
                  <Edit3 className="w-3 h-3" /> 수정
                </button>
              </>
            )}

            {/* Delete Button (Only for classroom notices) */}
            {!notice.isSchoolEvent && (
              <button
                onClick={handleDeleteClick}
                className="px-2.5 py-1 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold hover:bg-rose-100 transition-colors flex items-center gap-1"
              >
                <Trash2 className="w-3 h-3" /> 삭제
              </button>
            )}

            <button
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-lg bg-slate-800 text-white text-xs font-bold hover:bg-slate-900 transition-colors"
            >
              닫기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
